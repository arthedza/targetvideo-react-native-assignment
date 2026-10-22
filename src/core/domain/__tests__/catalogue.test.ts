import { serverCatalogue as testCatalogue } from '../../infrastructure/mock/catalogue-fixture';
import { getEpisodeAccess } from '../access/episode-access';
import { quoteUnlock } from '../access/unlock-quote';
import { getEpisode, getRouteId } from '../catalogue';

describe('The reproducible demo catalogue', () => {
  it('offers three free episodes followed by one ten-coin continuation', () => {
    expect(testCatalogue.series.title).toBe("The CEO's Secret Life");
    expect(
      testCatalogue.series.episodes.map((episode) => episode.number),
    ).toEqual([1, 2, 3, 4]);
    expect(
      testCatalogue.series.episodes.map((episode) =>
        getEpisodeAccess(episode, []),
      ),
    ).toEqual(['free', 'free', 'free', 'locked']);
    const continuation = testCatalogue.series.episodes.find(
      (episode) => episode.number === 4,
    );

    expect(continuation?.unlockPriceCoins).toBe(10);
    expect(quoteUnlock(15, continuation?.unlockPriceCoins)).toEqual({
      ok: true,
      cost: 10,
      remaining: 5,
    });
  });

  it('uses unique stable episode identifiers within the selected series', () => {
    expect(
      new Set(testCatalogue.series.episodes.map((episode) => episode.id)).size,
    ).toBe(4);
    for (const episode of testCatalogue.series.episodes) {
      expect(episode.seriesId).toBe(testCatalogue.series.id);
      expect(episode.id.trim()).not.toBe('');
    }
  });
});

it('accepts a single route value and rejects ambiguous or malformed episode parameters', () => {
  expect(getEpisode(getRouteId(['ceo-ep-3']), testCatalogue.series)?.id).toBe(
    'ceo-ep-3',
  );
  for (const value of [[], ['ceo-ep-3', 'ceo-ep-4'], [42], null, 42]) {
    expect(getRouteId(value)).toBeUndefined();
  }
});
