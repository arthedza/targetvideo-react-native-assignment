import { useIsMutating, useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { ProfileCommand } from '../domain/api-schemas';
import type { DemoProfile } from '../domain/demo-profile';
import { defaultLocale } from '../localization/use-i18n';
import {
  catalogueOptions,
  offerOptions,
  profileKey,
  profileOptions,
  useDemoRuntime,
} from './demo-runtime';
import { useUiStore } from './ui-store';

export function useUnlockOffer(episodeId: string, enabled = true) {
  const { api } = useDemoRuntime();
  return useQuery({ ...offerOptions(api, episodeId), enabled });
}
export function useDemo() {
  const { api, client, isActive } = useDemoRuntime();
  const locale = defaultLocale;
  const { data: profile } = useQuery(profileOptions(api));
  const { data: catalogue } = useQuery(catalogueOptions(api, locale));
  const mutation = useMutation({
    mutationKey: ['profile-command'],
    scope: { id: 'profile' },
    mutationFn: async (
      command: ProfileCommand | { type: 'confirm'; episodeId: string },
    ) => {
      if (command.type !== 'confirm') return api.command(command);
      const offer =
        client.getQueryData(offerOptions(api, command.episodeId).queryKey) ??
        (await client.query(offerOptions(api, command.episodeId)));
      return api.command({
        type: 'unlock',
        episodeId: command.episodeId,
        generation: offer.generation,
        price: offer.price,
        idempotencyKey: `${offer.generation}:${command.episodeId}:${offer.price}`,
      });
    },
    onMutate: async () => {
      await client.cancelQueries({ queryKey: profileKey });
    },
    onSuccess: (next) => {
      if (!isActive()) return;
      client.setQueryData<DemoProfile>(profileKey, (previous) =>
        !previous ||
        next.generation > previous.generation ||
        (next.generation === previous.generation &&
          next.revision >= previous.revision)
          ? next
          : previous,
      );
      void client.invalidateQueries({ queryKey: ['offer'] });
    },
  });
  const { mutateAsync: mutate } = mutation;
  const pending = useIsMutating({ mutationKey: ['profile-command'] }) > 0;
  const refreshDemo = useCallback(async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: profileKey }),
      client.invalidateQueries({ queryKey: ['offer'] }),
    ]);
  }, [client]);
  const generation = useCallback(
    () => client.getQueryData(profileOptions(api).queryKey)?.generation ?? 0,
    [api, client],
  );
  const confirmUnlock = useCallback(
    (episodeId: string) =>
      mutate({ type: 'confirm', episodeId }).catch(() => undefined),
    [mutate],
  );
  const resetDemo = useCallback(() => {
    useUiStore.getState().setNetworkMode('normal');
    useUiStore.getState().dismissNotice();
    return mutate({ type: 'reset' }).catch(() => undefined);
  }, [mutate]);
  const toggleSavedSeries = useCallback(
    () =>
      mutate({ type: 'save', generation: generation() }).catch(() => undefined),
    [mutate, generation],
  );
  const saveProgress = useCallback(
    (episodeId: string, seconds: number) => {
      if (!Number.isFinite(seconds) || seconds < 0) return;
      const position = Math.floor(seconds);
      if (
        client.getQueryData(profileOptions(api).queryKey)?.progress[
          episodeId
        ] === position
      )
        return;
      return mutate({
        type: 'progress',
        episodeId,
        seconds: position,
        generation: generation(),
      }).catch(() => undefined);
    },
    [api, client, mutate, generation],
  );
  return useMemo(() => {
    if (!profile || !catalogue) throw new Error('Demo data has not hydrated.');
    return {
      wallet: profile.wallet,
      savedSeries: profile.savedSeries,
      progress: profile.progress,
      catalogue,
      confirmUnlock,
      resetDemo,
      toggleSavedSeries,
      saveProgress,
      pending,
      error: mutation.error,
      clearError: mutation.reset,
      refreshDemo,
    };
  }, [
    profile,
    catalogue,
    confirmUnlock,
    resetDemo,
    toggleSavedSeries,
    saveProgress,
    pending,
    mutation.error,
    mutation.reset,
    refreshDemo,
  ]);
}
