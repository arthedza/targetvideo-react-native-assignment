import { z } from 'zod';

import {
  type DemoWallet,
  unlockEpisode,
} from '../../domain/access/demo-wallet';
import { getEpisodeAccess } from '../../domain/access/episode-access';
import { quoteUnlock } from '../../domain/access/unlock-quote';
import {
  catalogueSchema,
  commandSchema,
  localeSchema,
  offerSchema,
  type ProfileCommand,
  profileSchema,
} from '../../domain/api-schemas';
import { getEpisode } from '../../domain/catalogue';
import {
  createDemoProfile,
  type DemoProfile,
  updateProgress,
} from '../../domain/demo-profile';
import { readDemoProfile, writeDemoProfile } from '../demo-storage';
import { createCatalogue, serverCatalogue } from './catalogue-fixture';
import {
  ApiError,
  type Fault,
  type NetworkMode,
  waitForTransport,
} from './transport';

let ledgerQueue = Promise.resolve();

export class MockApi {
  private fault: Fault = 'none';
  constructor(
    private readonly mode: () => NetworkMode = () => 'normal',
    private readonly latency = 350,
    private initialWallet?: DemoWallet,
  ) {}

  failNext(fault: Fault) {
    this.fault = fault;
  }

  private async exchange<T>(
    schema: z.ZodType<T>,
    work: () => Promise<unknown>,
    signal?: AbortSignal,
    mutation = false,
  ): Promise<T> {
    await waitForTransport(
      this.mode() === 'slow' ? this.latency * 5 : this.latency,
      signal,
    );
    if (this.mode() === 'offline') throw new ApiError('network');
    const fault = mutation ? this.fault : 'none';
    if (mutation) this.fault = 'none';
    if (fault === 'network') throw new ApiError('network');
    const response = await work();
    if (fault === 'lost-response') throw new ApiError('network');
    const parsed = schema.safeParse(
      fault === 'invalid-response'
        ? { invalid: true }
        : JSON.parse(JSON.stringify(response)),
    );
    if (!parsed.success) throw new ApiError('invalid-data');
    return parsed.data;
  }

  private async load(): Promise<DemoProfile> {
    if (this.initialWallet) return createDemoProfile(this.initialWallet);
    try {
      return await readDemoProfile(serverCatalogue.series);
    } catch {
      throw new ApiError('storage');
    }
  }

  catalogue(locale: unknown, signal?: AbortSignal) {
    const parsedLocale = localeSchema.safeParse(locale);
    if (!parsedLocale.success)
      return Promise.reject(new ApiError('invalid-data'));
    return this.exchange(
      catalogueSchema,
      async () => {
        const result = createCatalogue(parsedLocale.data);
        result.series.episodes = result.series.episodes.map((episode) => {
          const authoritative = getEpisode(episode.id, serverCatalogue.series);
          return {
            ...episode,
            unlockPriceCoins: authoritative
              ? authoritative.unlockPriceCoins
              : episode.unlockPriceCoins,
          };
        });
        return result;
      },
      signal,
    );
  }

  profile(signal?: AbortSignal) {
    return this.exchange(
      profileSchema,
      async () => {
        await ledgerQueue;
        return this.load();
      },
      signal,
    );
  }

  offer(episodeId: string, signal?: AbortSignal) {
    return this.exchange(
      offerSchema,
      async () => {
        await ledgerQueue;
        const profile = await this.load();
        const episode = getEpisode(episodeId, serverCatalogue.series);
        if (!episode) throw new ApiError('not-found');
        return {
          episodeId,
          price: episode.unlockPriceCoins,
          generation: profile.generation,
          balanceCoins: profile.wallet.balanceCoins,
          access: getEpisodeAccess(episode, profile.wallet.entitlements),
          quote: quoteUnlock(
            profile.wallet.balanceCoins,
            episode.unlockPriceCoins,
          ),
        };
      },
      signal,
    );
  }

  command(input: ProfileCommand) {
    const validated = commandSchema.safeParse(input);
    if (!validated.success) return Promise.reject(new ApiError('invalid-data'));
    const run = ledgerQueue.then(() =>
      this.exchange(
        profileSchema,
        async () => {
          const current =
            validated.data.type === 'reset'
              ? await this.load().catch(() => createDemoProfile())
              : await this.load();
          const next = this.apply(current, validated.data);
          if (!profileSchema.safeParse(next).success)
            throw new ApiError('invalid-data');
          try {
            await writeDemoProfile(next);
          } catch {
            throw new ApiError('storage');
          }
          this.initialWallet = undefined;
          return next;
        },
        undefined,
        validated.data.type === 'unlock',
      ),
    );
    ledgerQueue = run.then(
      () => {},
      () => {},
    );
    return run;
  }

  private apply(current: DemoProfile, command: ProfileCommand): DemoProfile {
    if (command.type === 'reset')
      return {
        ...createDemoProfile(),
        generation: Math.max(Date.now(), current.generation + 1),
        revision: current.revision + 1,
      };
    if (command.generation !== current.generation)
      throw new ApiError('stale-session');
    if (command.type === 'save')
      return {
        ...current,
        savedSeries: !current.savedSeries,
        revision: current.revision + 1,
      };
    if (command.type === 'progress') {
      const episode = getEpisode(command.episodeId, serverCatalogue.series);
      if (
        !episode ||
        getEpisodeAccess(episode, current.wallet.entitlements) === 'locked'
      )
        throw new ApiError('access-denied');
      return {
        ...updateProgress(
          current,
          command.episodeId,
          command.seconds,
          serverCatalogue.series,
        ),
        revision: current.revision + 1,
      };
    }
    const episode = getEpisode(command.episodeId, serverCatalogue.series);
    if (!episode) throw new ApiError('not-found');
    if (
      command.idempotencyKey !==
      `${command.generation}:${episode.id}:${command.price}`
    )
      throw new ApiError('offer-changed');
    if (getEpisodeAccess(episode, current.wallet.entitlements) !== 'locked')
      return current;
    if (command.price !== episode.unlockPriceCoins)
      throw new ApiError('offer-changed');
    const transaction = unlockEpisode(
      current.wallet,
      episode.id,
      serverCatalogue.series,
    );
    if (
      transaction.status !== 'unlocked' &&
      transaction.status !== 'already-unlocked' &&
      transaction.status !== 'free-episode'
    )
      throw new ApiError('insufficient-funds');
    return {
      ...current,
      wallet: transaction.wallet,
      revision: current.revision + 1,
    };
  }
}
