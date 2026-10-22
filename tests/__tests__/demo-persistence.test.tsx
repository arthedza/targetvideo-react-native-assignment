import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createDemoProfile } from '../../src/core/domain/demo-profile';
import {
  demoProfileKey,
  readDemoProfile,
  writeDemoProfile,
} from '../../src/core/infrastructure/demo-storage';
import { serverCatalogue } from '../../src/core/infrastructure/mock/catalogue-fixture';
import { MockApi } from '../../src/core/infrastructure/mock/mock-api';
import { profileStorage } from '../../src/core/infrastructure/profile-storage';
import { latestPlayer } from '../support/native-video';
import { openDemo } from '../support/router';
import { renderSession } from '../support/session';

it('restores purchased access, balance and watchlist, and persists an explicit reset', async () => {
  const first = await renderSession();
  await act(async () => {
    await first.result.current.confirmUnlock('ceo-ep-4');
    await first.result.current.toggleSavedSeries();
  });
  await first.unmount();
  const second = await renderSession();
  expect(second.result.current.wallet.balanceCoins).toBe(5);
  expect(second.result.current.wallet.entitlements).toHaveLength(1);
  expect(second.result.current.savedSeries).toBe(true);
  await act(() => second.result.current.resetDemo());
  await second.unmount();
  const reset = await renderSession();
  expect(reset.result.current.wallet).toEqual(createDemoProfile().wallet);
  expect(reset.result.current.savedSeries).toBe(false);
  expect(reset.result.current.progress).toEqual({});
});

it('restores playback position after pausing and reopening a session', async () => {
  const first = await openDemo('/player/ceo-ep-3');
  const native = latestPlayer();
  await act(() => {
    native.currentTime = 6;
    native.emit('timeUpdate', { currentTime: 6 });
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await first.unmount();
  await openDemo('/player/ceo-ep-3');
  expect(latestPlayer().currentTime).toBe(6);
});

it('waits for validated hydration before showing any purchase action', async () => {
  let finish: ((value: string | null) => void) | undefined;
  jest.spyOn(profileStorage, 'getItem').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const write = jest.spyOn(profileStorage, 'setItem');
  write.mockClear();
  await openDemo('/unlock/ceo-ep-4', undefined, undefined, false);
  expect(screen.getByText('Loading demo…')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Unlock for 10 Coins' }),
  ).toBeNull();
  expect(write).not.toHaveBeenCalled();
  if (!finish) throw new Error('Expected a pending read');
  const resolve = finish;
  await act(() => resolve(null));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
    ).toBeVisible(),
  );
});

it.each([
  'invalid json',
  JSON.stringify({
    ...createDemoProfile(),
    wallet: { balanceCoins: 100, entitlements: [] },
  }),
])(
  'does not play malformed saved access and requires explicit recovery: %s',
  async (raw) => {
    await profileStorage.setItem(demoProfileKey, raw);
    await openDemo('/player/ceo-ep-4');
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Saved demo could not be loaded/,
    );
    expect(screen.queryByLabelText('Video surface')).toBeNull();
    expect(await profileStorage.getItem(demoProfileKey)).toBe(raw);
    await fireEvent.press(screen.getByRole('button', { name: 'Reset demo' }));
    await waitFor(() =>
      expect(screen.getByText('Episode 4 is locked')).toBeVisible(),
    );
    expect((await new MockApi().profile()).wallet).toEqual(
      createDemoProfile().wallet,
    );
  },
);

it('retries a failed profile read without changing its saved data', async () => {
  jest
    .spyOn(profileStorage, 'getItem')
    .mockRejectedValueOnce(new Error('Storage unavailable'));
  await openDemo('/');
  expect(screen.getByRole('alert')).toBeVisible();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Retry demo storage' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('header', { name: 'DramaFlash' })).toBeVisible(),
  );
  expect(screen.queryByRole('alert')).toBeNull();
});

it('does not optimistically grant access when a durable write fails, and can retry', async () => {
  const { result } = await renderSession();
  jest
    .spyOn(profileStorage, 'setItem')
    .mockRejectedValueOnce(new Error('Storage full'));
  await act(() => result.current.confirmUnlock('ceo-ep-4'));
  expect(result.current.wallet.balanceCoins).toBe(15);
  expect(result.current.wallet.entitlements).toEqual([]);
  expect(
    screen.getByText('Demo changes could not be saved. Please retry.'),
  ).toBeVisible();
  await act(() => result.current.confirmUnlock('ceo-ep-4'));
  expect(result.current.wallet.balanceCoins).toBe(5);
  expect(
    screen.queryByText('Demo changes could not be saved. Please retry.'),
  ).toBeNull();
});

it.each(['resolve', 'reject'] as const)(
  'cancels presentation of a read that finishes after unmount: %s',
  async (outcome) => {
    let finish: (() => void) | undefined;
    jest.spyOn(profileStorage, 'getItem').mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          finish = () =>
            outcome === 'resolve'
              ? resolve(null)
              : reject(new Error('Late read'));
        }),
    );
    const app = await openDemo('/', undefined, undefined, false);
    await app.unmount();
    if (!finish) throw new Error('Expected a pending read');
    await act(finish);
  },
);

it('orders a reset behind an in-flight snapshot write', async () => {
  let finish: (() => void) | undefined;
  const original = profileStorage.setItem.bind(profileStorage);
  jest
    .spyOn(profileStorage, 'setItem')
    .mockImplementationOnce(async (...args) => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      await original(...args);
    });
  const first = writeDemoProfile({ ...createDemoProfile(), savedSeries: true });
  await act(async () => {
    await Promise.resolve();
  });
  const reset = writeDemoProfile(createDemoProfile());
  const hydrated = readDemoProfile(serverCatalogue.series);
  if (!finish) throw new Error('Expected a pending write');
  finish();
  await Promise.all([first, reset]);
  expect(await hydrated).toEqual(createDemoProfile());
});

it.each(['resolve', 'reject'] as const)(
  'detaches a write result after unmount and permits recovery: %s',
  async (outcome) => {
    const app = await renderSession();
    let finish: (() => void) | undefined;
    const original = profileStorage.setItem.bind(profileStorage);
    jest
      .spyOn(profileStorage, 'setItem')
      .mockImplementationOnce(async (...args) => {
        await new Promise<void>((resolve, reject) => {
          finish = () =>
            outcome === 'resolve' ? resolve() : reject(new Error('Late write'));
        });
        await original(...args);
      });
    let pending: Promise<unknown> | undefined;
    await act(() => {
      pending = app.result.current.confirmUnlock('ceo-ep-4');
    });
    await app.unmount();
    if (!finish) throw new Error('Expected a pending write');
    await act(async () => {
      finish?.();
      await pending;
    });
    expect(
      screen.queryByText('Demo changes could not be saved. Please retry.'),
    ).toBeNull();
    await writeDemoProfile(createDemoProfile());
    expect((await new MockApi().profile()).wallet.balanceCoins).toBe(15);
  },
);

it('checkpoints the current media clock when pause arrives between time-update events', async () => {
  const write = jest.spyOn(profileStorage, 'setItem');
  await openDemo('/player/ceo-ep-3');
  await act(() => {
    latestPlayer().currentTime = 5.8;
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await waitFor(() =>
    expect(write).toHaveBeenCalledWith(
      demoProfileKey,
      expect.stringContaining('"ceo-ep-3":5'),
    ),
  );
  expect((await new MockApi().profile()).progress['ceo-ep-3']).toBe(5);
});
