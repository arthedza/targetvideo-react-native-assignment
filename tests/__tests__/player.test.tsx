import { act, fireEvent, screen } from '@testing-library/react-native';

import { latestPlayer, players } from '../support/native-video';
import { openDemo } from '../support/router';

async function startEpisode(id = 'ceo-ep-3') {
  const app = await openDemo(`/player/${id}`);
  expect(screen.getByLabelText('Video surface')).toBeVisible();
  return { app, native: latestPlayer() };
}

describe('Watching real episode media through its native boundary', () => {
  it('returns Home from the immersive player and releases its video resource', async () => {
    const { native } = await startEpisode();
    await fireEvent.press(screen.getByRole('button', { name: 'Save series' }));
    expect(
      screen.getByRole('button', { name: 'Remove saved series' }),
    ).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByRole('header', { name: 'DramaFlash' })).toBeVisible();
    expect(native.released).toBe(true);
    expect(native.listenerCount).toBe(0);
  });

  it('does not turn a playback error and a late end event into a successful cliffhanger', async () => {
    const { native } = await startEpisode();
    await act(() => {
      native.setStatus('error');
      native.emit('playToEnd');
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/Video could not load/);
    expect(screen.queryByText('To be continued…')).toBeNull();
    expect(native.playing).toBe(false);
  });

  it('starts accessible media and keeps pause, resume and progress in sync', async () => {
    const { native } = await startEpisode();
    expect(screen.getByRole('header', { name: 'Episode 3' })).toBeVisible();
    expect(native.playing).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    expect(native.playing).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
    expect(native.playing).toBe(true);
    await act(() => native.emit('timeUpdate', { currentTime: 5 }));
    expect(screen.getByText('5s / 16s')).toBeVisible();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Jump to last 2 seconds' }),
    );
    expect(native.currentTime).toBe(14);
  });

  it('disables playback actions while the native player is loading', async () => {
    const { native } = await startEpisode();
    await act(() => native.setStatus('loading'));
    expect(screen.getByText('Loading video…')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
    await act(() => native.setStatus('readyToPlay'));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled();
  });

  it('presents one cliffhanger gate on actual end events without loading locked media', async () => {
    const { native } = await startEpisode();
    await act(() => {
      native.emit('playToEnd');
      native.emit('playToEnd');
    });

    expect(
      screen.getAllByRole('header', { name: 'To be continued…' }),
    ).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Unlock Episode 4' }),
    ).toBeVisible();
    expect(screen.getByText('15 Coins · Demo wallet')).toBeVisible();
    expect(players).toHaveLength(1);
    expect(native.released).toBe(true);
    expect(native.listenerCount).toBe(0);
  });

  it('cleans up interrupted playback and ignores a queued stale end callback', async () => {
    const { app, native } = await startEpisode();
    const queuedEnd = native.snapshotListener('playToEnd');
    await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Back to episodes' }),
    );
    await act(() => queuedEnd());

    expect(app.getPathname()).toBe('/series/ceo-secret-life');
    expect(screen.queryByText('To be continued…')).toBeNull();
    expect(native.released).toBe(true);
    expect(native.playing).toBe(false);
    expect(native.listenerCount).toBe(0);
  });

  it('shows a recoverable playback error and retries with a fresh native resource', async () => {
    const { native } = await startEpisode();
    await act(() => native.setStatus('error'));
    expect(screen.getByRole('alert')).toHaveTextContent(/Video could not load/);
    expect(screen.queryByText('To be continued…')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry video' }));
    expect(native.released).toBe(true);
    expect(latestPlayer()).not.toBe(native);
    expect(screen.getByLabelText('Video surface')).toBeVisible();
  });

  it('never creates a native player for a locked deep link', async () => {
    const app = await openDemo('/player/ceo-ep-4');
    expect(
      screen.getByRole('header', { name: 'Episode 4 is locked' }),
    ).toBeVisible();
    expect(players).toHaveLength(0);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock Episode 4' }),
    );
    expect(app.getPathname()).toBe('/unlock/ceo-ep-4');
  });

  it('recovers from an unknown deep link without creating native media', async () => {
    await openDemo('/player/missing');
    expect(
      screen.getByRole('header', { name: 'Episode not found' }),
    ).toBeVisible();
    expect(players).toHaveLength(0);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Back to episodes' }),
    );
  });

  it('can continue to a real free episode after playback ends', async () => {
    const { app, native } = await startEpisode('ceo-ep-1');
    await act(() => native.emit('playToEnd'));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Play Episode 2' }),
    );
    expect(app.getPathname()).toBe('/player/ceo-ep-2');
    expect(latestPlayer()).not.toBe(native);
  });

  it('ends the final entitled episode without inventing another episode', async () => {
    await openDemo('/player/ceo-ep-4', {
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
    expect(screen.getByLabelText('Video surface')).toBeVisible();
    await act(() => latestPlayer().emit('playToEnd'));
    expect(
      screen.getByText('You’ve reached the end of this story.'),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: /Episode 5/ })).toBeNull();
  });
});
