import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';

import { useEntranceAnimation } from '../use-entrance-animation';

afterEach(() => jest.restoreAllMocks());

it('animates entry and stops on reduced motion changes and unmount', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  const stop = jest.fn();
  const start = jest.fn();
  const timing = jest
    .spyOn(Animated, 'timing')
    .mockReturnValue({ stop, start, reset: jest.fn() });
  const events = jest.spyOn(AccessibilityInfo, 'addEventListener');
  const hook = await renderHook(useEntranceAnimation);
  expect(timing).toHaveBeenCalledWith(expect.anything(), {
    toValue: 1,
    duration: 220,
    useNativeDriver: true,
  });
  expect(start).toHaveBeenCalledTimes(1);
  const update = events.mock.calls.find(
    ([event]) => event === 'reduceMotionChanged',
  )?.[1];
  if (!update) throw new Error('Missing reduced-motion listener');
  await act(() => update(true));
  expect(stop).toHaveBeenCalled();
  await hook.unmount();
  await act(() => update(false));
  expect(start).toHaveBeenCalledTimes(1);
});

it.each(['resolve', 'reject'] as const)(
  'ignores a late accessibility result after unmount: %s',
  async (outcome) => {
    let finish = () => {};
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
      new Promise((resolve, reject) => {
        finish = () =>
          outcome === 'resolve'
            ? resolve(false)
            : reject(new Error('Unavailable'));
      }),
    );
    const hook = await renderHook(useEntranceAnimation);
    await hook.unmount();
    await act(finish);
  },
);

it('leaves content visible if the accessibility API fails', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockRejectedValue(new Error('Unavailable'));
  const value = jest.spyOn(Animated.Value.prototype, 'setValue');
  await renderHook(useEntranceAnimation);
  expect(value).toHaveBeenCalledWith(1);
});
