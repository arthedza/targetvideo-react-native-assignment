import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { useUiStore } from '../../src/core/application/ui-store';
import { MockApi } from '../../src/core/infrastructure/mock/mock-api';
import { profileStorage } from '../../src/core/infrastructure/profile-storage';
import { openDemo } from '../support/router';
import { renderSession } from '../support/session';

afterEach(() => jest.restoreAllMocks());

it('refreshes durable access after returning to foreground and detaches its listener on unmount', async () => {
  const subscription = jest.spyOn(AppState, 'addEventListener');
  const app = await openDemo('/');
  const change = subscription.mock.calls.find(
    ([name]) => name === 'change',
  )?.[1];
  if (!change) throw new Error('Missing app state subscription');
  const api = new MockApi();
  const offer = await api.offer('ceo-ep-4');
  await api.command({
    type: 'unlock',
    episodeId: offer.episodeId,
    price: offer.price,
    generation: offer.generation,
    idempotencyKey: `${offer.generation}:${offer.episodeId}:${offer.price}`,
  });
  await act(() => change('background'));
  expect(screen.getByText('15 Coins · Demo wallet')).toBeVisible();
  await act(() => change('active'));
  await waitFor(() =>
    expect(screen.getByText('5 Coins · Demo wallet')).toBeVisible(),
  );
  await app.unmount();
  await act(() => change('active'));
});

it('persists an already-confirmed reset even if its error screen closes during the write', async () => {
  await profileStorage.setItem('dramaflash.demo-profile.v1', '{broken');
  const app = await openDemo('/');
  let finish = () => {};
  const original = profileStorage.setItem.bind(profileStorage);
  jest
    .spyOn(profileStorage, 'setItem')
    .mockImplementationOnce(async (...args) => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      await original(...args);
    });
  await fireEvent.press(screen.getByRole('button', { name: 'Reset demo' }));
  expect(screen.getByRole('button', { name: 'Reset demo' })).toBeDisabled();
  await app.unmount();
  await act(finish);
  expect((await new MockApi().profile()).wallet.balanceCoins).toBe(15);
});

it('exposes failed save, progress and reset through the same recoverable API error policy', async () => {
  const { result } = await renderSession();
  useUiStore.getState().setNetworkMode('offline');
  await act(() => result.current.toggleSavedSeries());
  expect(result.current.savedSeries).toBe(false);
  await act(() => result.current.saveProgress('ceo-ep-3', 3));
  expect(result.current.progress).toEqual({});
  const command = jest
    .spyOn(MockApi.prototype, 'command')
    .mockRejectedValueOnce(new Error('Write interrupted'));
  try {
    await act(() => result.current.resetDemo());
    expect(result.current.wallet.balanceCoins).toBe(15);
    expect(result.current.error).toBeInstanceOf(Error);
  } finally {
    command.mockRestore();
  }
});
