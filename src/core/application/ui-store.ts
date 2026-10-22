import { create } from 'zustand';

import type {
  ApiErrorCode,
  NetworkMode,
} from '../infrastructure/mock/transport';

type UiState = {
  networkMode: NetworkMode;
  notice: ApiErrorCode | 'share' | null;
  noticeId: number;
  setNetworkMode: (mode: NetworkMode) => void;
  notify: (code: ApiErrorCode | 'share') => void;
  dismissNotice: () => void;
};
export const useUiStore = create<UiState>()((set) => ({
  networkMode: 'normal',
  notice: null,
  noticeId: 0,
  setNetworkMode: (networkMode) => set({ networkMode }),
  notify: (notice) =>
    set((state) => ({ notice, noticeId: state.noticeId + 1 })),
  dismissNotice: () => set({ notice: null }),
}));
