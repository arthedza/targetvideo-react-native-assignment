import {
  keepPreviousData,
  MutationCache,
  QueryCache,
  QueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import type { DemoWallet } from '../domain/access/demo-wallet';
import type { Locale } from '../domain/api-schemas';
import { MockApi } from '../infrastructure/mock/mock-api';
import { ApiError } from '../infrastructure/mock/transport';
import { useUiStore } from './ui-store';

export function reportApiError(error: unknown) {
  useUiStore
    .getState()
    .notify(error instanceof ApiError ? error.code : 'network');
}
export function createDemoRuntime(initialWallet?: DemoWallet) {
  let active = true;
  const api = new MockApi(
    () => useUiStore.getState().networkMode,
    350,
    initialWallet,
  );
  const client = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (active && query.state.data !== undefined) reportApiError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (active) reportApiError(error);
      },
      onSuccess: () => {
        if (active && useUiStore.getState().notice !== 'share')
          useUiStore.getState().dismissNotice();
      },
    }),
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 15_000,
        gcTime: 300_000,
        networkMode: 'always',
      },
      mutations: { retry: false, networkMode: 'always', gcTime: 0 },
    },
  });
  return {
    api,
    client,
    isActive: () => active,
    activate: () => {
      active = true;
    },
    dispose: () => {
      active = false;
      void Promise.resolve().then(() => {
        if (!active) client.clear();
      });
    },
  };
}
export type DemoRuntime = ReturnType<typeof createDemoRuntime>;
export const DemoRuntimeContext = createContext<DemoRuntime | null>(null);
export function useDemoRuntime() {
  const runtime = useContext(DemoRuntimeContext);
  if (!runtime) throw new Error('DramaFlash screens require a DemoProvider.');
  return runtime;
}
export const profileKey = ['profile'] as const;
export const profileOptions = (api: MockApi) =>
  queryOptions({
    queryKey: profileKey,
    queryFn: ({ signal }) => api.profile(signal),
  });
export const catalogueOptions = (api: MockApi, locale: Locale) =>
  queryOptions({
    queryKey: ['catalogue', locale],
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => api.catalogue(locale, signal),
  });
export const offerOptions = (api: MockApi, episodeId: string) =>
  queryOptions({
    queryKey: ['offer', episodeId],
    queryFn: ({ signal }) => api.offer(episodeId, signal),
    staleTime: 0,
  });
