import type { z } from 'zod';

import type { walletSchema } from '../api-schemas';
import { getEpisode, type Series } from '../catalogue';
import { getEpisodeAccess } from './episode-access';
import { quoteUnlock, type UnlockQuote } from './unlock-quote';

export type Entitlement = Readonly<
  z.infer<typeof walletSchema>['entitlements'][number]
>;

export type DemoWallet = Readonly<{
  balanceCoins: number;
  entitlements: readonly Entitlement[];
}>;

export type UnlockStatus =
  | 'unlocked'
  | 'already-unlocked'
  | 'free-episode'
  | 'unknown-episode'
  | Extract<UnlockQuote, { ok: false }>['reason'];

export type UnlockTransaction = Readonly<{
  status: UnlockStatus;
  wallet: DemoWallet;
}>;

export function createDemoWallet(): DemoWallet {
  return { balanceCoins: 15, entitlements: [] };
}

export function unlockEpisode(
  wallet: DemoWallet,
  episodeId: unknown,
  series: Series,
): UnlockTransaction {
  const episode = getEpisode(episodeId, series);
  if (!episode) return { status: 'unknown-episode', wallet };
  if (episode.isFree) return { status: 'free-episode', wallet };
  if (getEpisodeAccess(episode, wallet.entitlements) === 'unlocked') {
    return { status: 'already-unlocked', wallet };
  }

  const quote = quoteUnlock(wallet.balanceCoins, episode.unlockPriceCoins);
  if (!quote.ok) return { status: quote.reason, wallet };

  return {
    status: 'unlocked',
    wallet: {
      balanceCoins: quote.remaining,
      entitlements: [
        ...wallet.entitlements,
        {
          episodeId: episode.id,
          kind: 'episode-unlock',
          source: 'demo-coins',
          paidCoins: quote.cost,
        },
      ],
    },
  };
}
