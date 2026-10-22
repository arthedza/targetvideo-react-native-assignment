import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useState } from 'react';

import type { DemoWallet } from '../domain/access/demo-wallet';
import { DemoBootstrap } from './demo-bootstrap';
import { createDemoRuntime, DemoRuntimeContext } from './demo-runtime';

export { useDemo } from './use-demo';

export function DemoProvider({
  children,
  initialWallet,
}: PropsWithChildren<{ initialWallet?: DemoWallet }>) {
  const [runtime] = useState(() => createDemoRuntime(initialWallet));
  useEffect(() => {
    runtime.activate();
    return runtime.dispose;
  }, [runtime]);
  return (
    <DemoRuntimeContext.Provider value={runtime}>
      <QueryClientProvider client={runtime.client}>
        <DemoBootstrap>{children}</DemoBootstrap>
      </QueryClientProvider>
    </DemoRuntimeContext.Provider>
  );
}
