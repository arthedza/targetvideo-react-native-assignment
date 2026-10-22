import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { EpisodeVideo } from '../../src/features/player/episode-video';
import { latestPlayer } from '../support/native-video';

it('does not start playback when mounted while the app is already backgrounded', async () => {
  const original = AppState.currentState;
  AppState.currentState = 'background';
  try {
    await render(
      <EpisodeVideo asset="demo" onEnded={jest.fn()} onRetry={jest.fn()} />,
    );
    expect(latestPlayer().playing).toBe(false);
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
  } finally {
    AppState.currentState = original;
  }
});

it('ignores completion while backgrounded and waits for explicit playback after returning', async () => {
  let dispatch: ((state: AppStateStatus) => void) | undefined;
  const subscription = jest.spyOn(AppState, 'addEventListener');
  const original = subscription.getMockImplementation();
  subscription.mockImplementation((_event, listener) => {
    dispatch = listener;
    return { remove: jest.fn() };
  });
  const onEnded = jest.fn();
  try {
    await render(
      <EpisodeVideo asset="demo" onEnded={onEnded} onRetry={jest.fn()} />,
    );
    if (!dispatch) throw new Error('Expected an AppState subscription');
    const changeState = dispatch;
    await act(() => changeState('background'));
    await act(() => latestPlayer().emit('playToEnd'));
    expect(onEnded).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    await act(() => changeState('active'));
    await act(() => latestPlayer().emit('playToEnd'));
    expect(onEnded).not.toHaveBeenCalled();
    expect(latestPlayer().playing).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
    await act(() => latestPlayer().emit('playToEnd'));
    expect(onEnded).toHaveBeenCalledTimes(1);
  } finally {
    subscription.mockRestore();
    if (original)
      jest.mocked(AppState.addEventListener).mockImplementation(original);
  }
});

it('does not accept a queued completion after the viewer pauses playback', async () => {
  const onEnded = jest.fn();
  await render(
    <EpisodeVideo asset="demo" onEnded={onEnded} onRetry={jest.fn()} />,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await act(() => latestPlayer().emit('playToEnd'));
  expect(onEnded).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  await act(() => latestPlayer().emit('playToEnd'));
  expect(onEnded).toHaveBeenCalledTimes(1);
});

it('ignores an app-state callback that was queued before the player unmounted', async () => {
  let dispatch: ((state: AppStateStatus) => void) | undefined;
  const subscription = jest.spyOn(AppState, 'addEventListener');
  const original = subscription.getMockImplementation();
  subscription.mockImplementation((_event, listener) => {
    dispatch = listener;
    return { remove: jest.fn() };
  });
  try {
    const app = await render(
      <EpisodeVideo asset="demo" onEnded={jest.fn()} onRetry={jest.fn()} />,
    );
    const native = latestPlayer();
    const pause = jest.spyOn(native, 'pause');
    await app.unmount();
    expect(native.released).toBe(true);
    if (!dispatch) throw new Error('Expected an AppState subscription');
    const queued = dispatch;
    await act(() => queued('background'));
    expect(pause).not.toHaveBeenCalled();
  } finally {
    subscription.mockRestore();
    if (original)
      jest.mocked(AppState.addEventListener).mockImplementation(original);
  }
});

it.each([NaN, -1])(
  'retains its last known position when the native clock is temporarily invalid: %s',
  async (clock) => {
    const checkpoint = jest.fn();
    await render(
      <EpisodeVideo
        asset="demo"
        onEnded={jest.fn()}
        onRetry={jest.fn()}
        onProgress={checkpoint}
      />,
    );
    await act(() => {
      latestPlayer().emit('timeUpdate', { currentTime: 3 });
      latestPlayer().currentTime = clock;
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    expect(checkpoint).toHaveBeenLastCalledWith(3);
  },
);
