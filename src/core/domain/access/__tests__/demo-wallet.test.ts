import { serverCatalogue as testCatalogue } from '../../../infrastructure/mock/catalogue-fixture';
import { getEpisode, getNextEpisode } from '../../catalogue';
import { createDemoWallet, unlockEpisode } from '../demo-wallet';
import { getEpisodeAccess } from '../episode-access';

describe('Continuing with demo coins', () => {
  const episodeId = 'ceo-ep-4';

  it('atomically spends ten coins and makes Episode 4 playable', () => {
    const original = Object.freeze(createDemoWallet());
    const result = unlockEpisode(original, episodeId, testCatalogue.series);

    expect(result.status).toBe('unlocked');
    expect(result.wallet.balanceCoins).toBe(5);
    expect(result.wallet.entitlements).toHaveLength(1);
    expect(
      getEpisodeAccess(
        getEpisode(episodeId, testCatalogue.series),
        result.wallet.entitlements,
      ),
    ).toBe('unlocked');
    expect(original).toEqual({ balanceCoins: 15, entitlements: [] });
  });

  it('handles two consecutive confirmations with one deduction and entitlement', () => {
    const first = unlockEpisode(
      createDemoWallet(),
      episodeId,
      testCatalogue.series,
    );
    const second = unlockEpisode(first.wallet, episodeId, testCatalogue.series);

    expect(second.status).toBe('already-unlocked');
    expect(second.wallet).toBe(first.wallet);
    expect(second.wallet).toEqual({
      balanceCoins: 5,
      entitlements: [
        {
          episodeId,
          kind: 'episode-unlock',
          source: 'demo-coins',
          paidCoins: 10,
        },
      ],
    });
  });

  it('leaves the same wallet unchanged when coins are insufficient', () => {
    const wallet = { ...createDemoWallet(), balanceCoins: 9 };

    expect(unlockEpisode(wallet, episodeId, testCatalogue.series)).toEqual({
      status: 'insufficient-funds',
      wallet,
    });
    expect(
      getEpisodeAccess(
        getEpisode(episodeId, testCatalogue.series),
        wallet.entitlements,
      ),
    ).toBe('locked');
  });

  it('spends the exact balance and leaves zero', () => {
    const result = unlockEpisode(
      { ...createDemoWallet(), balanceCoins: 10 },
      episodeId,
      testCatalogue.series,
    );

    expect(result.status).toBe('unlocked');
    expect(result.wallet.balanceCoins).toBe(0);
  });

  it.each([-1, 1.5, NaN, Infinity])(
    'rejects invalid wallet coins: %p',
    (balanceCoins) => {
      const wallet = { ...createDemoWallet(), balanceCoins };

      expect(unlockEpisode(wallet, episodeId, testCatalogue.series)).toEqual({
        status: 'invalid-balance',
        wallet,
      });
    },
  );

  it('never charges for a free episode', () => {
    const wallet = createDemoWallet();

    expect(unlockEpisode(wallet, 'ceo-ep-3', testCatalogue.series)).toEqual({
      status: 'free-episode',
      wallet,
    });
  });

  it.each(['missing', '', undefined, ['ceo-ep-4']])(
    'cannot sell an unknown episode: %p',
    (id) => {
      const wallet = createDemoWallet();

      expect(unlockEpisode(wallet, id, testCatalogue.series)).toEqual({
        status: 'unknown-episode',
        wallet,
      });
    },
  );

  it('resets spent coins and entitlements without affecting the purchased state', () => {
    const purchased = unlockEpisode(
      createDemoWallet(),
      episodeId,
      testCatalogue.series,
    ).wallet;
    const reset = createDemoWallet();

    expect(purchased.balanceCoins).toBe(5);
    expect(reset).toEqual({ balanceCoins: 15, entitlements: [] });
    expect(
      getEpisodeAccess(
        getEpisode(episodeId, testCatalogue.series),
        reset.entitlements,
      ),
    ).toBe('locked');
    expect(purchased.entitlements).toHaveLength(1);
  });
});

describe('Safe episode continuation', () => {
  it('finds free episodes and the real locked continuation by stable ID', () => {
    expect(getEpisode('ceo-ep-1', testCatalogue.series)?.isFree).toBe(true);
    expect(getNextEpisode('ceo-ep-3', testCatalogue.series)?.id).toBe(
      'ceo-ep-4',
    );
  });

  it('does not invent a continuation after the final or an unknown episode', () => {
    expect(getNextEpisode('ceo-ep-4', testCatalogue.series)).toBeUndefined();
    expect(getNextEpisode('missing', testCatalogue.series)).toBeUndefined();
    expect(getEpisode(null, testCatalogue.series)).toBeUndefined();
  });
});
