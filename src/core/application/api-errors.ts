import type { ApiErrorCode } from '../infrastructure/mock/transport';
import type { MessageKey } from '../localization/use-i18n';

export const apiMessageKeys = {
  network: 'networkError',
  'invalid-data': 'invalidResponse',
  'offer-changed': 'offerChanged',
  'stale-session': 'staleSession',
  'not-found': 'contentUnavailable',
  'insufficient-funds': 'notEnough',
  storage: 'storageError',
  share: 'shareError',
  'access-denied': 'accessDenied',
} as const satisfies Record<ApiErrorCode | 'share', MessageKey>;
