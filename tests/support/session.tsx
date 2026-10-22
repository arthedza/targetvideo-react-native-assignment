import { renderHook, waitFor } from '@testing-library/react-native';

import { DemoProvider, useDemo } from '../../src/core/application/demo-session';

export async function renderSession() {
  const session = await renderHook(useDemo, { wrapper: DemoProvider });
  await waitFor(() => expect(session.result.current).toBeDefined());
  return session;
}
