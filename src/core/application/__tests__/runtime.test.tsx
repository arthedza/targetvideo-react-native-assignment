import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { createDemoProfile } from '../../domain/demo-profile';
import { createCatalogue } from '../../infrastructure/mock/catalogue-fixture';
import { ApiError } from '../../infrastructure/mock/transport';
import {
  catalogueOptions,
  createDemoRuntime,
  DemoRuntimeContext,
  profileKey,
  reportApiError,
} from '../demo-runtime';
import { useUiStore } from '../ui-store';
import { useDemo, useUnlockOffer } from '../use-demo';

it('reports background refresh errors while retaining the last validated data', async () => {
  const runtime = createDemoRuntime();
  runtime.client.setQueryData(['background'], 'previous');
  await expect(
    runtime.client.query({
      queryKey: ['background'],
      staleTime: 0,
      queryFn: () => {
        throw new ApiError('network');
      },
    }),
  ).rejects.toThrow();
  expect(runtime.client.getQueryData(['background'])).toBe('previous');
  expect(useUiStore.getState().notice).toBe('network');
  reportApiError(new Error('Unknown adapter error'));
  expect(useUiStore.getState().notice).toBe('network');
  runtime.dispose();
  await Promise.resolve();
  await expect(
    runtime.client.query({
      queryKey: ['late'],
      queryFn: () => {
        throw new ApiError('storage');
      },
    }),
  ).rejects.toThrow();
  expect(useUiStore.getState().notice).toBe('network');
  runtime.dispose();
});

it('keeps unrelated share errors through successful profile mutations and survives strict effect replay', async () => {
  const runtime = createDemoRuntime();
  useUiStore.getState().notify('share');
  runtime.dispose();
  runtime.activate();
  await Promise.resolve();
  const mutation = runtime.client.getMutationCache().build(runtime.client, {
    mutationFn: () => runtime.api.command({ type: 'save', generation: 0 }),
  });
  await mutation.execute(undefined);
  expect(useUiStore.getState().notice).toBe('share');
  runtime.dispose();
});

it('rejects an unhydrated session and independently loads a default-enabled offer', async () => {
  const runtime = createDemoRuntime();
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <DemoRuntimeContext.Provider value={runtime}>
        <QueryClientProvider client={runtime.client}>
          {children}
        </QueryClientProvider>
      </DemoRuntimeContext.Provider>
    );
  }
  await expect(renderHook(useDemo, { wrapper: Wrapper })).rejects.toThrow(
    'Demo data has not hydrated.',
  );
  runtime.client.setQueryData(profileKey, createDemoProfile());
  runtime.client.setQueryData(
    catalogueOptions(runtime.api, 'en').queryKey,
    createCatalogue('en'),
  );
  const hook = await renderHook(() => useUnlockOffer('ceo-ep-4'), {
    wrapper: Wrapper,
  });
  await act(async () => {
    await runtime.client.query({
      queryKey: ['offer', 'ceo-ep-4'],
      queryFn: () => runtime.api.offer('ceo-ep-4'),
    });
  });
  expect(hook.result.current.data?.price).toBe(10);
  await hook.unmount();
  runtime.dispose();
});

it('rejects older cache snapshots and ignores invalid or duplicate progress writes', async () => {
  const runtime = createDemoRuntime();
  runtime.client.setQueryData(profileKey, {
    ...createDemoProfile(),
    revision: 10,
  });
  runtime.client.setQueryData(
    catalogueOptions(runtime.api, 'en').queryKey,
    createCatalogue('en'),
  );
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <DemoRuntimeContext.Provider value={runtime}>
        <QueryClientProvider client={runtime.client}>
          {children}
        </QueryClientProvider>
      </DemoRuntimeContext.Provider>
    );
  }
  const hook = await renderHook(useDemo, { wrapper: Wrapper });
  await act(() => hook.result.current.toggleSavedSeries());
  expect(hook.result.current.savedSeries).toBe(false);
  await act(() => hook.result.current.resetDemo());
  expect(hook.result.current.wallet.balanceCoins).toBe(15);
  const command = jest.spyOn(runtime.api, 'command');
  await act(() => hook.result.current.saveProgress('ceo-ep-3', Number.NaN));
  await act(() => hook.result.current.saveProgress('ceo-ep-3', -1));
  expect(command).not.toHaveBeenCalled();
  await act(() => hook.result.current.saveProgress('ceo-ep-3', 4.8));
  await act(() => hook.result.current.saveProgress('ceo-ep-3', 4));
  expect(command).toHaveBeenCalledTimes(1);
  expect(hook.result.current.progress['ceo-ep-3']).toBe(4);
  await hook.unmount();
  runtime.dispose();
});

it('rejects a late checkpoint from an evicted session after its generation has been reset', async () => {
  const runtime = createDemoRuntime();
  runtime.client.setQueryData(profileKey, createDemoProfile());
  runtime.client.setQueryData(
    catalogueOptions(runtime.api, 'en').queryKey,
    createCatalogue('en'),
  );
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <DemoRuntimeContext.Provider value={runtime}>
        <QueryClientProvider client={runtime.client}>
          {children}
        </QueryClientProvider>
      </DemoRuntimeContext.Provider>
    );
  }
  const hook = await renderHook(useDemo, { wrapper: Wrapper });
  const save = hook.result.current.saveProgress;
  await hook.unmount();
  runtime.dispose();
  await Promise.resolve();
  await runtime.api.command({ type: 'reset' });
  await act(() => save('ceo-ep-3', 3));
  expect((await runtime.api.profile()).progress).toEqual({});
  expect(useUiStore.getState().notice).toBeNull();
  runtime.dispose();
});
