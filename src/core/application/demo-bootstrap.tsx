import { focusManager, useMutation, useQuery } from '@tanstack/react-query';
import { type PropsWithChildren, useCallback, useEffect } from 'react';
import { AppState, View } from 'react-native';

import { DemoStorageNotice } from '../../ui/demo-storage-notice';
import { ToastHost } from '../../ui/toast-host';
import { defaultLocale } from '../localization/use-i18n';
import {
  catalogueOptions,
  profileOptions,
  useDemoRuntime,
} from './demo-runtime';
import { useUiStore } from './ui-store';

export function DemoBootstrap({ children }: PropsWithChildren) {
  const { api, client, isActive } = useDemoRuntime();
  const locale = defaultLocale;
  const catalogue = useQuery(catalogueOptions(api, locale));
  const profile = useQuery(profileOptions(api));
  const reset = useMutation({
    mutationKey: ['profile-command'],
    scope: { id: 'profile' },
    onMutate: async () => {
      await client.cancelQueries({ queryKey: profileOptions(api).queryKey });
    },
    mutationFn: () => api.command({ type: 'reset' }),
    onSuccess: (next) => {
      if (!isActive()) return;
      client.setQueryData(profileOptions(api).queryKey, next);
      void catalogue.refetch();
    },
  });
  useEffect(() => {
    let alive = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (!alive) return;
      focusManager.setFocused(state === 'active');
      if (state === 'active') void client.invalidateQueries();
    });
    return () => {
      alive = false;
      subscription.remove();
    };
  }, [client]);
  const { refetch: refetchCatalogue } = catalogue;
  const { refetch: refetchProfile } = profile;
  const { mutate: mutateReset } = reset;
  const ready = catalogue.data && profile.data;
  const retryLoad = useCallback(() => {
    void refetchCatalogue();
    void refetchProfile();
  }, [refetchCatalogue, refetchProfile]);
  const resetProfile = useCallback(() => {
    useUiStore.getState().setNetworkMode('normal');
    mutateReset();
  }, [mutateReset]);
  return (
    <View style={containerStyle}>
      {!ready ? (
        <DemoStorageNotice
          loading
          busy={reset.isPending}
          error={catalogue.isError || profile.isError ? 'load' : null}
          onRetry={retryLoad}
          onReset={resetProfile}
        />
      ) : (
        children
      )}
      <ToastHost />
    </View>
  );
}

const containerStyle = { flex: 1 } as const;
