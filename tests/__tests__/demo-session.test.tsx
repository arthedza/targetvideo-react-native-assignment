import { act, renderHook } from '@testing-library/react-native';

import { useDemo } from '../../src/core/application/demo-session';
import { renderSession } from '../support/session';

describe('A demo session shared across screens', () => {
  it('serializes confirmations from the same render without charging twice', async () => {
    const { result } = await renderSession();
    await act(async () => {
      await Promise.all([
        result.current.confirmUnlock('ceo-ep-4'),
        result.current.confirmUnlock('ceo-ep-4'),
      ]);
    });
    expect(result.current.wallet.balanceCoins).toBe(5);
    expect(result.current.wallet.entitlements).toHaveLength(1);
  });

  it('restores the original wallet and access after resetting a spent session', async () => {
    const { result } = await renderSession();
    await act(() => result.current.confirmUnlock('ceo-ep-4'));
    expect(result.current.wallet.balanceCoins).toBe(5);
    await act(() => result.current.resetDemo());
    expect(result.current.wallet).toEqual({
      balanceCoins: 15,
      entitlements: [],
    });
  });

  it('rejects composition without its session rather than fabricating a wallet', async () => {
    await expect(renderHook(useDemo)).rejects.toThrow(
      'DramaFlash screens require a DemoProvider.',
    );
  });
});

it('keeps the context value stable on parent renders and actions stable across state changes', async () => {
  const { result, rerender } = await renderSession();
  const initial = result.current;
  await rerender({});
  expect(result.current).toBe(initial);
  await act(() => result.current.toggleSavedSeries());
  expect(result.current.savedSeries).toBe(true);
  expect(result.current.confirmUnlock).toBe(initial.confirmUnlock);
  expect(result.current.resetDemo).toBe(initial.resetDemo);
  expect(result.current.toggleSavedSeries).toBe(initial.toggleSavedSeries);
});
