import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { useUiStore } from '../../src/core/application/ui-store';
import { MockApi } from '../../src/core/infrastructure/mock/mock-api';
import { profileStorage } from '../../src/core/infrastructure/profile-storage';
import { openDemo } from '../support/router';

it.each([
  ['Fail next unlock', false],
  ['Lose next unlock response', true],
  ['Invalid next unlock response', true],
] as const)(
  'recovers from %s through the visible offer refresh action',
  async (fault, committed) => {
    const app = await openDemo('/');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Demo settings' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Slow connection' }),
    );
    expect(useUiStore.getState().networkMode).toBe('slow');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Normal connection' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: fault }));
    expect(
      screen.getByText('The next unlock will simulate a failure.'),
    ).toBeVisible();
    const locked = screen.getAllByRole('button', {
      name: 'Unlock The Gala Encounter',
    })[0];
    if (!locked) throw new Error('Missing locked chapter card');
    await fireEvent.press(locked);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
    );
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByText('Balance: 15 Coins')).toBeVisible();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Refresh offer' }),
    );
    if (!committed) {
      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
      await fireEvent.press(
        screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
      );
    }
    await waitFor(() => expect(app.getPathname()).toBe('/player/ceo-ep-4'));
    expect((await new MockApi().profile()).wallet.balanceCoins).toBe(5);
  },
);

it('recovers from offline mode with Reset demo', async () => {
  await openDemo('/');
  await fireEvent.press(screen.getByRole('button', { name: 'Demo settings' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Offline demo' }));
  expect(useUiStore.getState().networkMode).toBe('offline');
  await fireEvent.press(screen.getByRole('button', { name: '✓ Offline demo' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Demo settings' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Reset demo' }));
  expect(useUiStore.getState().networkMode).toBe('normal');
  expect(screen.getByText('15 Coins · Demo wallet')).toBeVisible();
});

it('displays an unexpected adapter error through the shared error policy', async () => {
  await openDemo('/unlock/ceo-ep-4');
  const command = jest
    .spyOn(MockApi.prototype, 'command')
    .mockRejectedValueOnce(new Error('Adapter crashed'));
  try {
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/request failed/);
    await act(() => useUiStore.getState().dismissNotice());
  } finally {
    command.mockRestore();
  }
});

it('discards a stale hydration response when reset overtakes a pending profile read', async () => {
  const api = new MockApi();
  const offer = await api.offer('ceo-ep-4');
  const purchased = await api.command({
    type: 'unlock',
    episodeId: offer.episodeId,
    price: offer.price,
    generation: offer.generation,
    idempotencyKey: `${offer.generation}:${offer.episodeId}:${offer.price}`,
  });
  let finish = (_value: string) => {};
  jest.spyOn(profileStorage, 'getItem').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const catalogue = jest
    .spyOn(MockApi.prototype, 'catalogue')
    .mockRejectedValueOnce(new Error('Catalogue unavailable'));
  try {
    await openDemo('/player/ceo-ep-4', undefined, undefined, false);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Reset demo' })).toBeVisible(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Reset demo' }));
    await waitFor(() =>
      expect(screen.getByText('Episode 4 is locked')).toBeVisible(),
    );
    await act(() => finish(JSON.stringify(purchased)));
    expect(screen.getByText('Episode 4 is locked')).toBeVisible();
    expect((await api.profile()).wallet.balanceCoins).toBe(15);
  } finally {
    catalogue.mockRestore();
  }
});
