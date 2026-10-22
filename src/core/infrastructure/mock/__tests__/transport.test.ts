import { MockApi } from '../mock-api';

const { waitForTransport } =
  jest.requireActual<typeof import('../transport')>('../transport');

it('delays requests, supports abort before and during transport, and removes listeners', async () => {
  jest.useFakeTimers();
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const complete = jest.fn();
  const request = waitForTransport(350, controller.signal).then(complete);
  await jest.advanceTimersByTimeAsync(349);
  expect(complete).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1);
  await request;
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  const aborted = waitForTransport(350, controller.signal);
  const rejected = expect(aborted).rejects.toMatchObject({
    name: 'AbortError',
  });
  controller.abort();
  await rejected;
  await expect(waitForTransport(350, controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  });
  const noSignal = waitForTransport(10);
  await jest.advanceTimersByTimeAsync(10);
  await noSignal;
  expect(jest.getTimerCount()).toBe(0);
});

it('multiplies only slow transport latency and rejects unsupported locales', async () => {
  const call = jest.spyOn(
    jest.requireMock<typeof import('../transport')>('../transport'),
    'waitForTransport',
  );
  await new MockApi(() => 'slow', 80).catalogue('en');
  expect(call).toHaveBeenLastCalledWith(400, undefined);
  await expect(new MockApi().catalogue('de')).rejects.toMatchObject({
    code: 'invalid-data',
  });
  call.mockRestore();
});
