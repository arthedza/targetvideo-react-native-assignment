import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';

import { EpisodeVideo } from '../../src/features/player/episode-video';
import { latestPlayer, videoSurfaceRenders } from '../support/native-video';
import { openDemo } from '../support/router';

it('updates progress without redrawing the native video surface', async () => {
  await render(
    <EpisodeVideo asset="demo" onEnded={jest.fn()} onRetry={jest.fn()} />,
  );
  const before = videoSurfaceRenders;
  await act(() => latestPlayer().emit('timeUpdate', { currentTime: 6 }));
  expect(screen.getByText('6s / 16s')).toBeVisible();
  expect(videoSurfaceRenders).toBe(before);
});

it('waits for a known duration before enabling the last-two-seconds shortcut', async () => {
  await openDemo('/player/ceo-ep-3');
  const native = latestPlayer();
  await act(() => {
    native.duration = 0;
    native.setStatus('readyToPlay');
  });
  expect(
    screen.getByRole('button', { name: 'Jump to last 2 seconds' }),
  ).toBeDisabled();
  await act(() => {
    native.duration = 16;
    native.emit('sourceLoad', { duration: 16 });
  });
  const jump = screen.getByRole('button', { name: 'Jump to last 2 seconds' });
  expect(jump).toBeEnabled();
  await fireEvent.press(jump);
  expect(native.currentTime).toBe(14);
});

it('pauses on leaving the foreground and removes the app-state listener on exit', async () => {
  let change: ((state: AppStateStatus) => void) | undefined;
  const remove = jest.fn();
  const wasMock = jest.isMockFunction(AppState.addEventListener);
  const subscription = jest.spyOn(AppState, 'addEventListener');
  const originalImplementation = subscription.getMockImplementation();
  subscription.mockImplementation((_event, listener) => {
    change = listener;
    return { remove };
  });
  try {
    await render(
      <EpisodeVideo asset="demo" onEnded={jest.fn()} onRetry={jest.fn()} />,
    );
    const native = latestPlayer();
    if (!change) throw new Error('Player did not subscribe to app state.');
    const dispatch = change;
    await act(() => dispatch('active'));
    expect(native.playing).toBe(true);
    await act(() => dispatch('inactive'));
    expect(native.playing).toBe(false);
    await act(() => dispatch('background'));
    await act(() => dispatch('active'));
    expect(native.playing).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
    expect(native.playing).toBe(true);
    await screen.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  } finally {
    subscription.mockRestore();
    if (wasMock && originalImplementation) {
      jest
        .mocked(AppState.addEventListener)
        .mockImplementation(originalImplementation);
    }
  }
});

it.each([NaN, Infinity, -1, 0])(
  'keeps unknown duration %s readable and accessible',
  async (duration) => {
    await openDemo('/player/ceo-ep-3');
    await act(() => latestPlayer().emit('sourceLoad', { duration }));
    expect(screen.getByLabelText('Episode progress')).toHaveAccessibilityValue({
      text: 'Duration unavailable',
    });
    expect(screen.getByText('0s / —')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Jump to last 2 seconds' }),
    ).toBeDisabled();
  },
);

it.each([
  { duration: 1, currentTime: 0.7 },
  { duration: 16, currentTime: 15 },
])(
  'never rewinds a viewer already within the last two seconds ($duration s clip)',
  async ({ duration, currentTime }) => {
    await openDemo('/player/ceo-ep-3');
    const native = latestPlayer();
    await act(() => {
      native.duration = duration;
      native.currentTime = currentTime;
      native.emit('sourceLoad', { duration });
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Jump to last 2 seconds' }),
    );
    expect(native.currentTime).toBe(currentTime);
    expect(native.playing).toBe(true);
  },
);

it('pauses a mounted player when another route covers it and requires explicit resume on return', async () => {
  const app = await openDemo('/player/ceo-ep-3');
  const native = latestPlayer();
  await act(() => router.push('/series/ceo-secret-life'));
  expect(app.getPathname()).toBe('/series/ceo-secret-life');
  expect(native.released).toBe(false);
  expect(native.playing).toBe(false);
  await act(() => native.emit('playToEnd'));
  await act(() => router.back());
  expect(app.getPathname()).toBe('/player/ceo-ep-3');
  expect(screen.getByRole('button', { name: 'Play' })).toBeVisible();
  expect(screen.queryByText('To be continued…')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  expect(native.playing).toBe(true);
});

it.each([
  { time: NaN, expected: 0 },
  { time: -1, expected: 0 },
  { time: 40, expected: 16 },
])(
  'keeps progress time $time within the playable range',
  async ({ time, expected }) => {
    await openDemo('/player/ceo-ep-3');
    await act(() => latestPlayer().emit('timeUpdate', { currentTime: time }));
    expect(screen.getByLabelText('Episode progress')).toHaveAccessibilityValue({
      min: 0,
      max: 16,
      now: expected,
    });
    expect(screen.getByText(`${expected}s / 16s`)).toBeVisible();
  },
);

it('exposes playback progress as a screen-reader progress control', async () => {
  await openDemo('/player/ceo-ep-3');
  expect(
    screen.getByRole('progressbar', { name: 'Episode progress' }),
  ).toBeVisible();
});

it('keeps initially inactive media stopped and its actions unavailable until focused', async () => {
  const callbacks = { onEnded: jest.fn(), onRetry: jest.fn() };
  const view = await render(
    <EpisodeVideo asset="demo" active={false} {...callbacks} />,
  );
  const native = latestPlayer();
  expect(native.playing).toBe(false);
  expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
  await view.rerender(<EpisodeVideo asset="demo" active {...callbacks} />);
  expect(native.playing).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  expect(native.playing).toBe(true);
});
