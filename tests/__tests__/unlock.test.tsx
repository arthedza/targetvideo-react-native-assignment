import { act, fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { latestPlayer, players } from '../support/native-video';
import { openDemo } from '../support/router';

describe('Unlocking the continuation with demo coins', () => {
  it('makes the real pending render accessible and prevents another action while unlocking', async () => {
    let observe = false;
    const pendingStates: boolean[] = [];
    await openDemo('/unlock/ceo-ep-4', undefined, () => {
      if (!observe) return;
      const pending = screen.queryByRole('button', { name: 'Unlocking…' });
      if (!pending) return;
      expect(pending).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Maybe Later' }),
      ).toBeDisabled();
      pendingStates.push(true);
    });
    observe = true;
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
    );
    expect(pendingStates).toContain(true);
    expect(screen.getByText('5 Coins · Demo wallet')).toBeVisible();
  });

  it('completes Home → cliffhanger → one unlock → playable Episode 4 with five coins', async () => {
    const app = await openDemo('/');
    await fireEvent.press(screen.getByRole('button', { name: 'Watch now' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Watch demo cliffhanger (Ep 3)' }),
    );
    await act(() => latestPlayer().emit('playToEnd'));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock Episode 4' }),
    );
    expect(
      screen.getByRole('header', { name: 'Unlock Episode 4' }),
    ).toBeVisible();
    expect(screen.getByText('Balance: 15 Coins')).toBeVisible();
    expect(screen.getByLabelText('Price: 10 Coins')).toHaveTextContent(
      '10 Coins',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
    );

    expect(app.getPathname()).toBe('/player/ceo-ep-4');
    expect(screen.getByRole('header', { name: 'Episode 4' })).toBeVisible();
    expect(screen.getByText('5 Coins · Demo wallet')).toBeVisible();
    expect(screen.getByLabelText('Video surface')).toBeVisible();
    expect(players).toHaveLength(2);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Back to episodes' }),
    );
    expect(
      screen.getByRole('button', { name: 'Play Episode 4' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Unlock Episode 4' }),
    ).toBeNull();
  });

  it('cancels back to the original cliffhanger without spending or granting access', async () => {
    const app = await openDemo('/player/ceo-ep-3');
    await act(() => latestPlayer().emit('playToEnd'));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock Episode 4' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Maybe Later' }));

    expect(app.getPathname()).toBe('/player/ceo-ep-3');
    expect(
      screen.getByRole('header', { name: 'To be continued…' }),
    ).toBeVisible();
    expect(screen.getByText('15 Coins · Demo wallet')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Unlock Episode 4' }),
    ).toBeVisible();
    expect(players).toHaveLength(1);
  });

  it('cancels a standalone offer safely back to the selected series', async () => {
    const app = await openDemo('/unlock/ceo-ep-4');
    await fireEvent.press(screen.getByRole('button', { name: 'Maybe Later' }));
    expect(app.getPathname()).toBe('/series/ceo-secret-life');
    expect(screen.getByText('15 Coins · Demo wallet')).toBeVisible();
  });

  it('blocks confirmation when there are insufficient coins', async () => {
    await openDemo('/unlock/ceo-ep-4', { balanceCoins: 9, entitlements: [] });
    expect(screen.getByRole('alert')).toHaveTextContent(/Not enough Coins/);
    const confirm = screen.getByRole('button', { name: 'Unlock for 10 Coins' });
    expect(confirm).toBeDisabled();
    await fireEvent.press(confirm);
    expect(screen.getByText('Balance: 9 Coins')).toBeVisible();
    expect(players).toHaveLength(0);
  });

  it('never asks an already entitled viewer to pay again', async () => {
    const app = await openDemo('/unlock/ceo-ep-4', {
      balanceCoins: 5,
      entitlements: [
        {
          episodeId: 'ceo-ep-4',
          kind: 'episode-unlock',
          source: 'demo-coins',
          paidCoins: 10,
        },
      ],
    });
    expect(app.getPathname()).toBe('/player/ceo-ep-4');
    expect(screen.getByText('5 Coins · Demo wallet')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Unlock for/ })).toBeNull();
  });

  it('does not charge for a free episode even through an unlock deep link', async () => {
    const app = await openDemo('/unlock/ceo-ep-1');
    expect(app.getPathname()).toBe('/player/ceo-ep-1');
    expect(screen.getByText('15 Coins · Demo wallet')).toBeVisible();
  });

  it('recovers from an unavailable offer without creating access', async () => {
    const app = await openDemo('/unlock/missing');
    expect(
      screen.getByRole('header', { name: 'Episode not found' }),
    ).toBeVisible();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Back to episodes' }),
    );
    expect(app.getPathname()).toBe('/series/ceo-secret-life');
    expect(players).toHaveLength(0);
  });
});

async function unlockFromCliffhanger() {
  const app = await openDemo('/');
  await fireEvent.press(screen.getByRole('button', { name: 'Watch now' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Watch demo cliffhanger (Ep 3)' }),
  );
  await act(() => latestPlayer().emit('playToEnd'));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Unlock Episode 4' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
  );
  expect(app.getPathname()).toBe('/player/ceo-ep-4');
  return app;
}

describe('Returning without revisiting a completed cliffhanger', () => {
  it('clears the playback journey when Home is selected from Episode 4', async () => {
    const app = await unlockFromCliffhanger();
    const native = latestPlayer();
    await fireEvent.press(screen.getByRole('button', { name: 'Home' }));
    expect(app.getPathname()).toBe('/');
    expect(router.canGoBack()).toBe(false);
    expect(native.released).toBe(true);
  });

  it('returns to the original Home entry from series details', async () => {
    const app = await openDemo('/');
    await fireEvent.press(screen.getByRole('button', { name: 'Watch now' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Back to Home' }));
    expect(app.getPathname()).toBe('/');
    expect(router.canGoBack()).toBe(false);
  });

  it('uses system Back from Episode 4 to return to episodes, then Home', async () => {
    const app = await unlockFromCliffhanger();
    const native = latestPlayer();
    await act(() => router.back());
    expect(app.getPathname()).toBe('/series/ceo-secret-life');
    expect(
      screen.getByRole('button', { name: 'Play Episode 4' }),
    ).toBeVisible();
    expect(screen.getByText('5 Coins · Demo wallet')).toBeVisible();
    expect(native.released).toBe(true);
    await act(() => router.back());
    expect(app.getPathname()).toBe('/');
    expect(router.canGoBack()).toBe(false);
    expect(screen.queryByText('To be continued…')).toBeNull();
  });
});

it('returns from the unlocked player to the existing series without leaving the old cliffhanger behind', async () => {
  const app = await unlockFromCliffhanger();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Back to episodes' }),
  );
  expect(app.getPathname()).toBe('/series/ceo-secret-life');
  await act(() => router.back());
  expect(app.getPathname()).toBe('/');
  expect(screen.queryByText('To be continued…')).toBeNull();
});

it.each(['/', '/player/ceo-ep-3'])(
  'returns through episodes to Home even without a prior series entry (%s)',
  async (initialUrl) => {
    const app = await openDemo(initialUrl);
    if (initialUrl === '/') {
      const card = screen.getAllByRole('button', {
        name: 'Play A Glimpse Behind the Mask',
      })[0];
      if (!card) throw new Error('The cliffhanger chapter is missing.');
      await fireEvent.press(card);
    }
    await act(() => latestPlayer().emit('playToEnd'));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock Episode 4' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
    );
    expect(app.getPathname()).toBe('/player/ceo-ep-4');
    await act(() => router.back());
    expect(app.getPathname()).toBe('/series/ceo-secret-life');
    await act(() => router.back());
    expect(app.getPathname()).toBe('/');
    expect(router.canGoBack()).toBe(false);
    expect(screen.getByText('5 Coins · Demo wallet')).toBeVisible();
  },
);
