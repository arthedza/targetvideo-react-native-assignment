import { serverCatalogue as testCatalogue } from '../../infrastructure/mock/catalogue-fixture';
import { unlockEpisode } from '../access/demo-wallet';
import {
  createDemoProfile,
  parseDemoProfile,
  updateProgress,
} from '../demo-profile';

const fresh = createDemoProfile();
const purchased = {
  ...fresh,
  wallet: unlockEpisode(fresh.wallet, 'ceo-ep-4', testCatalogue.series).wallet,
  savedSeries: true,
  progress: { 'ceo-ep-4': 7 },
};

it('round-trips a purchased profile with its balance, exact access and progress', () => {
  expect(
    parseDemoProfile(
      JSON.parse(JSON.stringify(purchased)),
      testCatalogue.series,
    ),
  ).toEqual(purchased);
  expect(parseDemoProfile(fresh, testCatalogue.series)).toEqual(fresh);
});

it.each([
  null,
  [],
  'profile',
  { ...fresh, version: 2 },
  { ...fresh, savedSeries: 'true' },
  { ...fresh, wallet: null },
  { ...fresh, wallet: { balanceCoins: 15, entitlements: null } },
  { ...fresh, progress: [] },
  { ...fresh, wallet: { ...fresh.wallet, balanceCoins: 100 } },
  { ...purchased, wallet: { ...purchased.wallet, balanceCoins: 15 } },
  ...[
    null,
    { kind: 'subscription' },
    { kind: 'episode-unlock', source: 'other' },
    { kind: 'episode-unlock', source: 'demo-coins', episodeId: 'missing' },
    { kind: 'episode-unlock', source: 'demo-coins', episodeId: 'ceo-ep-1' },
  ].map((grant) => ({
    ...fresh,
    wallet: { balanceCoins: 15, entitlements: [grant] },
  })),
  {
    ...purchased,
    wallet: {
      ...purchased.wallet,
      entitlements: [
        ...purchased.wallet.entitlements,
        ...purchased.wallet.entitlements,
      ],
    },
  },
  { ...fresh, progress: { missing: 3 } },
  ...['6', NaN, Infinity, -1, 1.5].map((seconds) => ({
    ...fresh,
    progress: { 'ceo-ep-3': seconds },
  })),
])('rejects incompatible or inconsistent saved data: %p', (value) => {
  expect(parseDemoProfile(value, testCatalogue.series)).toBeUndefined();
});

it('records whole seconds without mutating the profile or granting access', () => {
  const updated = updateProgress(fresh, 'ceo-ep-3', 6.7, testCatalogue.series);
  expect(updated.progress).toEqual({ 'ceo-ep-3': 6 });
  expect(updated.wallet).toBe(fresh.wallet);
  expect(fresh.progress).toEqual({});
  expect(updateProgress(updated, 'ceo-ep-3', 6.9, testCatalogue.series)).toBe(
    updated,
  );
  expect(
    updateProgress(purchased, 'ceo-ep-4', 8, testCatalogue.series).progress[
      'ceo-ep-4'
    ],
  ).toBe(8);
});

it.each([
  ['missing', 5],
  ['ceo-ep-4', 5],
  ['ceo-ep-3', NaN],
  ['ceo-ep-3', -1],
  ['ceo-ep-3', Number.MAX_VALUE],
] as const)(
  'ignores invalid or inaccessible progress: %s, %s',
  (id, seconds) => {
    expect(updateProgress(fresh, id, seconds, testCatalogue.series)).toBe(
      fresh,
    );
  },
);

it('rejects purchases without a recorded paid amount', () => {
  const invalid = {
    ...purchased,
    wallet: {
      balanceCoins: 5,
      entitlements: [
        { episodeId: 'ceo-ep-4', kind: 'episode-unlock', source: 'demo-coins' },
      ],
    },
  };
  expect(parseDemoProfile(invalid, testCatalogue.series)).toBeUndefined();
});
