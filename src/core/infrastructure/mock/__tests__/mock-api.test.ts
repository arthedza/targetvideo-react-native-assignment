import { demoProfileKey } from '../../demo-storage';
import { profileStorage } from '../../profile-storage';
import { serverCatalogue } from '../catalogue-fixture';
import { MockApi } from '../mock-api';
import { ApiError } from '../transport';

async function intent(api: MockApi, episodeId = 'ceo-ep-4') {
  const offer = await api.offer(episodeId);
  return {
    type: 'unlock',
    episodeId,
    generation: offer.generation,
    price: offer.price,
    idempotencyKey: `${offer.generation}:${episodeId}:${offer.price}`,
  } as const;
}

it('commits an unlock once and reads the durable result', async () => {
  const api = new MockApi(() => 'normal', 0);
  const offer = await api.offer('ceo-ep-4');
  const command = {
    type: 'unlock',
    episodeId: offer.episodeId,
    generation: offer.generation,
    price: offer.price,
    idempotencyKey: `${offer.generation}:${offer.episodeId}:${offer.price}`,
  } as const;
  const first = await api.command(command);
  expect(first.wallet.balanceCoins).toBe(5);
  expect((await api.command(command)).wallet.balanceCoins).toBe(5);
  expect((await api.profile()).wallet.entitlements).toHaveLength(1);
});

it('returns English catalogue copies and three distinct media assets', async () => {
  const api = new MockApi();
  const en = await api.catalogue('en');
  expect(en.series.episodes[0]?.title).toBe('Episode 1');
  expect(
    new Set(en.series.episodes.map((entry) => entry.videoAsset)).size,
  ).toBe(3);
  en.series.title = 'Changed locally';
  expect((await api.catalogue('en')).series.title).toBe(
    serverCatalogue.series.title,
  );
});

it.each(['lost-response', 'invalid-response'] as const)(
  'recovers an uncertain purchase without a second debit: %s',
  async (fault) => {
    const api = new MockApi();
    const command = await intent(api);
    api.failNext(fault);
    await expect(api.command(command)).rejects.toBeInstanceOf(ApiError);
    expect((await api.profile()).wallet.balanceCoins).toBe(5);
    expect((await api.command(command)).wallet.balanceCoins).toBe(5);
  },
);

it('fails before the commit without spending, and can retry', async () => {
  const api = new MockApi();
  const command = await intent(api);
  api.failNext('network');
  await expect(api.command(command)).rejects.toMatchObject({ code: 'network' });
  expect((await api.profile()).wallet.balanceCoins).toBe(15);
  expect((await api.command(command)).wallet.balanceCoins).toBe(5);
});

it('rejects changed quotes and mismatched idempotency keys', async () => {
  const api = new MockApi();
  const command = await intent(api);
  await expect(
    api.command({ ...command, idempotencyKey: 'other' }),
  ).rejects.toMatchObject({ code: 'offer-changed' });
  const episode = serverCatalogue.series.episodes.find(
    (entry) => entry.id === command.episodeId,
  );
  if (!episode) throw new Error('Missing episode');
  const price = jest.replaceProperty(episode, 'unlockPriceCoins', 5);
  try {
    await expect(api.command(command)).rejects.toMatchObject({
      code: 'offer-changed',
    });
    expect((await api.profile()).wallet.balanceCoins).toBe(15);
  } finally {
    price.restore();
  }
});

it('serializes confirmations and rejects stale commands after a durable reset', async () => {
  const api = new MockApi();
  const command = await intent(api);
  const results = await Promise.all([
    api.command(command),
    api.command(command),
  ]);
  expect(results.map((value) => value.wallet.balanceCoins)).toEqual([5, 5]);
  const reset = await api.command({ type: 'reset' });
  expect(reset.wallet.entitlements).toEqual([]);
  await expect(api.command(command)).rejects.toMatchObject({
    code: 'stale-session',
  });
  await expect(
    api.command({
      type: 'progress',
      episodeId: 'ceo-ep-3',
      seconds: 6,
      generation: command.generation,
    }),
  ).rejects.toMatchObject({ code: 'stale-session' });
  expect((await new MockApi().profile()).wallet.balanceCoins).toBe(15);
});

it('keeps access separate from saved progress and handles free episodes without spending', async () => {
  const api = new MockApi();
  await expect(
    api.command({
      type: 'progress',
      episodeId: 'ceo-ep-4',
      seconds: 5,
      generation: 0,
    }),
  ).rejects.toMatchObject({ code: 'access-denied' });
  await expect(
    api.command({
      type: 'progress',
      episodeId: 'missing',
      seconds: 5,
      generation: 0,
    }),
  ).rejects.toMatchObject({ code: 'access-denied' });
  const free = await api.command(await intent(api, 'ceo-ep-1'));
  expect(free.wallet.balanceCoins).toBe(15);
  const position = await api.command({
    type: 'progress',
    episodeId: 'ceo-ep-3',
    seconds: 6,
    generation: 0,
  });
  expect(position.progress['ceo-ep-3']).toBe(6);
  expect((await api.command({ type: 'save', generation: 0 })).savedSeries).toBe(
    true,
  );
});

it('validates requests and refuses unknown episodes and insufficient funds', async () => {
  const api = new MockApi();
  for (const input of [
    null,
    { type: 'unlock' },
    { type: 'reset', wallet: { balanceCoins: 100 } },
  ])
    await expect(
      Reflect.apply(api.command, api, [input]),
    ).rejects.toMatchObject({ code: 'invalid-data' });
  await expect(api.offer('missing')).rejects.toMatchObject({
    code: 'not-found',
  });
  await expect(
    api.command({
      type: 'unlock',
      episodeId: 'missing',
      generation: 0,
      price: 10,
      idempotencyKey: '0:missing:10',
    }),
  ).rejects.toMatchObject({ code: 'not-found' });
  const poor = new MockApi(() => 'normal', 0, {
    balanceCoins: 9,
    entitlements: [],
  });
  expect((await poor.offer('ceo-ep-4')).quote.ok).toBe(false);
  await expect(poor.command(await intent(poor))).rejects.toMatchObject({
    code: 'insufficient-funds',
  });
});

it('does not grant access when persistence fails and recovers after retry', async () => {
  const api = new MockApi();
  const command = await intent(api);
  jest
    .spyOn(profileStorage, 'setItem')
    .mockRejectedValueOnce(new Error('Storage full'));
  await expect(api.command(command)).rejects.toMatchObject({ code: 'storage' });
  expect((await api.profile()).wallet.balanceCoins).toBe(15);
  expect((await api.command(command)).wallet.balanceCoins).toBe(5);
});

it('blocks malformed persisted profiles until an explicit reset', async () => {
  const api = new MockApi();
  await profileStorage.setItem(demoProfileKey, '{bad json');
  await expect(api.profile()).rejects.toMatchObject({ code: 'storage' });
  expect((await api.command({ type: 'reset' })).wallet.balanceCoins).toBe(15);
});

it('honors offline simulation and rejects canceled requests', async () => {
  const offline = new MockApi(() => 'offline', 0);
  await expect(offline.profile()).rejects.toMatchObject({ code: 'network' });
  const canceled = new AbortController();
  canceled.abort();
  await expect(
    new MockApi().catalogue('en', canceled.signal),
  ).rejects.toMatchObject({ name: 'AbortError' });
});

it('refuses an overflowing revision before writing a damaged profile', async () => {
  const api = new MockApi();
  const current = {
    ...(await api.profile()),
    revision: Number.MAX_SAFE_INTEGER,
  };
  await profileStorage.setItem(demoProfileKey, JSON.stringify(current));
  await expect(
    api.command({ type: 'save', generation: current.generation }),
  ).rejects.toMatchObject({ code: 'invalid-data' });
  expect((await api.profile()).revision).toBe(Number.MAX_SAFE_INTEGER);
  expect((await api.profile()).savedSeries).toBe(false);
});

it('retains fixture metadata when a catalogue entry has not reached the authoritative snapshot yet', async () => {
  const original = serverCatalogue.series.episodes;
  serverCatalogue.series.episodes = original.filter(
    (episode) => episode.id !== 'ceo-ep-4',
  );
  try {
    expect(
      (await new MockApi().catalogue('en')).series.episodes.at(-1)
        ?.unlockPriceCoins,
    ).toBe(10);
  } finally {
    serverCatalogue.series.episodes = original;
  }
});

it('retains the paid price and access across later catalogue price changes', async () => {
  const api = new MockApi();
  const command = await intent(api);
  await api.command(command);
  const episode = serverCatalogue.series.episodes.find(
    (entry) => entry.id === command.episodeId,
  );
  if (!episode) throw new Error('Missing paid chapter');
  const price = jest.replaceProperty(episode, 'unlockPriceCoins', 8);
  try {
    expect((await new MockApi().profile()).wallet.balanceCoins).toBe(5);
    expect((await api.command(command)).wallet.balanceCoins).toBe(5);
  } finally {
    price.restore();
  }
});
