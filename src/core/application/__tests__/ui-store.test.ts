import { useUiStore } from '../ui-store';

it('keeps connection simulation and transient notices separate from the profile', () => {
  const state = useUiStore.getState();
  expect(state.networkMode).toBe('normal');
  state.setNetworkMode('offline');
  state.notify('network');
  expect(useUiStore.getState()).toMatchObject({
    networkMode: 'offline',
    notice: 'network',
    noticeId: 1,
  });
  state.notify('network');
  expect(useUiStore.getState().noticeId).toBe(2);
  state.dismissNotice();
  expect(useUiStore.getState().notice).toBeNull();
});
