import { screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Profiler, type ProfilerOnRenderCallback } from 'react';

import RootLayout from '../../app/_layout';
import HomeRoute from '../../app/index';
import PlayerRoute from '../../app/player/[episodeId]';
import SeriesRoute from '../../app/series/[seriesId]';
import UnlockRoute from '../../app/unlock/[episodeId]';
import { DemoProvider } from '../../src/core/application/demo-session';
import type { DemoWallet } from '../../src/core/domain/access/demo-wallet';

const routes = {
  _layout: RootLayout,
  index: HomeRoute,
  'series/[seriesId]': SeriesRoute,
  'player/[episodeId]': PlayerRoute,
  'unlock/[episodeId]': UnlockRoute,
};

export async function openDemo(
  initialUrl: string,
  initialWallet?: DemoWallet,
  onRender?: ProfilerOnRenderCallback,
  hydrate = true,
) {
  function Layout() {
    const content = initialWallet ? (
      <DemoProvider initialWallet={initialWallet}>
        <Stack screenOptions={{ headerShown: false }} />
      </DemoProvider>
    ) : (
      <RootLayout />
    );
    return onRender ? (
      <Profiler id="demo" onRender={onRender}>
        {content}
      </Profiler>
    ) : (
      content
    );
  }
  const app = await renderRouter(
    { ...routes, _layout: Layout },
    { initialUrl },
  );
  if (hydrate)
    await waitFor(() => expect(screen.queryByText('Loading demo…')).toBeNull());
  return app;
}
