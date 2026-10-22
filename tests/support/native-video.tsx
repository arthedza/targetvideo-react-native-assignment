import { useEffect, useState } from 'react';
import { View } from 'react-native';

type Listener = (payload?: unknown) => void;

export class NativePlayer {
  status = 'readyToPlay';
  playing = false;
  duration = 16;
  currentTime = 0;
  loop = false;
  timeUpdateEventInterval = 0;
  released = false;
  private listeners = new Map<string, Set<Listener>>();

  constructor(readonly source: unknown) {}

  addListener(event: string, listener: Listener) {
    const group = this.listeners.get(event) ?? new Set<Listener>();
    group.add(listener);
    this.listeners.set(event, group);
    return { remove: () => group.delete(listener) };
  }

  emit(event: string, payload?: unknown) {
    for (const listener of this.listeners.get(event) ?? []) listener(payload);
  }

  snapshotListener(event: string): Listener {
    const listener = this.listeners.get(event)?.values().next().value;
    if (!listener) throw new Error(`No native ${event} listener registered.`);
    return listener;
  }

  get listenerCount() {
    return [...this.listeners.values()].reduce(
      (count, group) => count + group.size,
      0,
    );
  }

  play() {
    this.playing = true;
    this.emit('playingChange', { isPlaying: true });
  }

  pause() {
    this.playing = false;
    this.emit('playingChange', { isPlaying: false });
  }

  seekBy(seconds: number) {
    this.currentTime += seconds;
  }

  release() {
    this.released = true;
    this.playing = false;
    this.listeners.clear();
  }

  setStatus(status: string) {
    this.status = status;
    this.emit('statusChange', { status });
  }
}

export const players: NativePlayer[] = [];
export let videoSurfaceRenders = 0;
export function resetPlayers() {
  players.length = 0;
  videoSurfaceRenders = 0;
}
export function latestPlayer(): NativePlayer {
  const player = players.at(-1);
  if (!player) throw new Error('Expected native video to initialize.');
  return player;
}

export function useVideoPlayer(
  source: unknown,
  setup: (player: NativePlayer) => void,
) {
  const [player] = useState(() => {
    const created = new NativePlayer(source);
    players.push(created);
    setup(created);
    return created;
  });
  useEffect(() => () => player.release(), [player]);
  return player;
}

export function VideoView() {
  useEffect(() => {
    videoSurfaceRenders += 1;
  });
  return <View accessibilityLabel="Video surface" />;
}
