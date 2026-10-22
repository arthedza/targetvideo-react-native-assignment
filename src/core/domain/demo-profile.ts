import {
  createDemoWallet,
  type DemoWallet,
  unlockEpisode,
} from './access/demo-wallet';
import { getEpisodeAccess } from './access/episode-access';
import { profileSchema } from './api-schemas';
import { getEpisode, type Series } from './catalogue';

export type DemoProfile = Readonly<{
  revision: number;
  generation: number;
  version: 1;
  wallet: DemoWallet;
  savedSeries: boolean;
  progress: Readonly<Record<string, number>>;
}>;

export function createDemoProfile(wallet = createDemoWallet()): DemoProfile {
  return {
    version: 1,
    wallet,
    savedSeries: false,
    progress: {},
    revision: 0,
    generation: 0,
  };
}

export function parseDemoProfile(
  input: unknown,
  series: Series,
): DemoProfile | undefined {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return undefined;
  const value = parsed.data;
  let wallet = createDemoWallet();
  const entitlements = value.wallet.entitlements;
  for (const grant of entitlements) {
    const historicalSeries = {
      ...series,
      episodes: series.episodes.map((episode) =>
        episode.id === grant.episodeId
          ? {
              ...episode,
              unlockPriceCoins: grant.paidCoins,
            }
          : episode,
      ),
    };
    const transaction = unlockEpisode(
      wallet,
      grant.episodeId,
      historicalSeries,
    );
    if (transaction.status !== 'unlocked') return undefined;
    wallet = transaction.wallet;
  }
  if (wallet.balanceCoins !== value.wallet.balanceCoins) return undefined;
  const progress: Record<string, number> = {};
  for (const [id, seconds] of Object.entries(value.progress)) {
    if (!getEpisode(id, series)) return undefined;
    progress[id] = seconds;
  }
  return {
    version: 1,
    wallet,
    savedSeries: value.savedSeries,
    progress,
    revision: value.revision,
    generation: value.generation,
  };
}

export function updateProgress(
  profile: DemoProfile,
  id: string,
  seconds: number,
  series: Series,
): DemoProfile {
  const episode = getEpisode(id, series);
  if (
    !episode ||
    getEpisodeAccess(episode, profile.wallet.entitlements) === 'locked' ||
    !Number.isFinite(seconds) ||
    seconds < 0
  )
    return profile;
  const position = Math.floor(seconds);
  if (!Number.isSafeInteger(position) || profile.progress[id] === position)
    return profile;
  return { ...profile, progress: { ...profile.progress, [id]: position } };
}
