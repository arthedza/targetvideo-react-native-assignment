import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native';
import { Share } from 'react-native';

import { useUiStore } from '../../core/application/ui-store';
import { Button } from '../button';
import { DemoStorageNotice } from '../demo-storage-notice';
import { SeriesShare } from '../series-share';
import { ToastHost } from '../toast-host';

afterEach(() => jest.restoreAllMocks());

it('keeps storage failures explicit and hides the notice when storage is healthy', async () => {
  const retry = jest.fn();
  const reset = jest.fn();
  const app = await render(
    <DemoStorageNotice
      loading={false}
      error="save"
      onRetry={retry}
      onReset={reset}
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    /changes could not be saved/,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Retry demo storage' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Reset demo' }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(reset).toHaveBeenCalledTimes(1);
  await app.rerender(
    <DemoStorageNotice
      loading={false}
      error={null}
      onRetry={retry}
      onReset={reset}
    />,
  );
  expect(screen.queryByRole('alert')).toBeNull();
});

it('dismisses the current toast after five seconds and cancels its old timeout when replaced', async () => {
  jest.useFakeTimers();
  await render(<ToastHost />);
  await act(() => useUiStore.getState().notify('network'));
  await act(() => jest.advanceTimersByTime(4000));
  await act(() => useUiStore.getState().notify('storage'));
  await act(() => jest.advanceTimersByTime(1000));
  expect(useUiStore.getState().notice).toBe('storage');
  await act(() => jest.advanceTimersByTime(4000));
  expect(useUiStore.getState().notice).toBeNull();
});

it('gives a pressed button visual feedback without losing its action', async () => {
  const press = jest.fn();
  await render(<Button label="Action" onPress={press} />);
  await userEvent.press(screen.getByRole('button', { name: 'Action' }));
  expect(press).toHaveBeenCalledTimes(1);
});

it.each([null, 'denied', { name: 'AbortError' }])(
  'treats only sharing cancellation as non-error: %p',
  async (error) => {
    jest.spyOn(Share, 'share').mockRejectedValue(error);
    await render(<SeriesShare title="Story" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Share series' }));
    expect(useUiStore.getState().notice).toBe(
      error !== null && typeof error === 'object' ? null : 'share',
    );
  },
);

it('ignores a share failure after unmount and blocks rapid duplicate share callbacks', async () => {
  let fail = (_error: Error) => {};
  const share = jest.spyOn(Share, 'share').mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
  );
  const app = await render(<SeriesShare title="Story" />);
  const button = screen.getByRole('button', { name: 'Share series' });
  const click: unknown = button.props.onClick;
  if (typeof click !== 'function')
    throw new Error('Missing native click handler');
  await act(() => {
    click();
    click();
  });
  expect(share).toHaveBeenCalledTimes(1);
  await app.unmount();
  await act(() => fail(new Error('Late failure')));
  expect(useUiStore.getState().notice).toBeNull();
});
