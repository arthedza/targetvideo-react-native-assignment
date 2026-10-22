export type NetworkMode = 'normal' | 'slow' | 'offline';
export type Fault = 'none' | 'network' | 'lost-response' | 'invalid-response';
export type ApiErrorCode =
  | 'network'
  | 'invalid-data'
  | 'offer-changed'
  | 'stale-session'
  | 'not-found'
  | 'insufficient-funds'
  | 'storage'
  | 'access-denied';

export class ApiError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
    this.name = 'ApiError';
  }
}

export function waitForTransport(
  ms: number,
  signal?: AbortSignal,
): Promise<void> {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  if (signal?.aborted) return Promise.reject(error);
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(error);
    };
    signal?.addEventListener('abort', abort, { once: true });
  });
}
