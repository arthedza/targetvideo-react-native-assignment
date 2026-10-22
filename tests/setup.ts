import { notifyManager } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AccessibilityInfo, AppState } from 'react-native';

import { useUiStore } from '../src/core/application/ui-store';
import { demoProfileKey } from '../src/core/infrastructure/demo-storage';
import { MockApi } from '../src/core/infrastructure/mock/mock-api';
import { resetPlayers } from './support/native-video';

jest.mock('expo-video', () =>
  jest.requireActual<typeof import('./support/native-video')>(
    './support/native-video',
  ),
);
jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
});
jest.mock('../src/core/infrastructure/mock/transport', () => {
  const actual = jest.requireActual<
    typeof import('../src/core/infrastructure/mock/transport')
  >('../src/core/infrastructure/mock/transport');
  return {
    ...actual,
    waitForTransport: (_ms: number, signal?: AbortSignal) =>
      signal?.aborted ? actual.waitForTransport(0, signal) : Promise.resolve(),
  };
});
notifyManager.setScheduler(queueMicrotask);

beforeEach(async () => {
  jest.useRealTimers();
  await new MockApi(() => 'normal', 0).profile().catch(() => undefined);
  AppState.currentState = 'active';
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  resetPlayers();
  await SecureStore.deleteItemAsync(demoProfileKey);
  useUiStore.setState({
    networkMode: 'normal',
    notice: null,
    noticeId: 0,
  });
});
afterEach(async () => {
  jest.useRealTimers();
  await cleanup();
  await new MockApi(() => 'normal', 0).profile().catch(() => undefined);
});
