import { act, fireEvent, screen } from '@testing-library/react-native';
import { Share } from 'react-native';

import { serverCatalogue as testCatalogue } from '../../src/core/infrastructure/mock/catalogue-fixture';
import { openDemo } from '../support/router';

afterEach(() => jest.restoreAllMocks());

it('keeps the interface in English when demo settings are opened', async () => {
  await openDemo('/');
  await fireEvent.press(screen.getByRole('button', { name: 'Demo settings' }));
  expect(screen.getByRole('button', { name: 'Watch now' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Slow connection' })).toBeVisible();
});

it('never opens two share sheets while the first request is pending', async () => {
  let complete: (() => void) | undefined;
  const share = jest.spyOn(Share, 'share').mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = () =>
          resolve({ action: Share.dismissedAction, activityType: undefined });
      }),
  );
  await openDemo('/series/ceo-secret-life');
  const button = screen.getByRole('button', { name: 'Share series' });
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(share).toHaveBeenCalledTimes(1);
  if (!complete) throw new Error('Expected a pending share');
  await act(complete);
});

it('rejects a changed price instead of silently purchasing a different offer', async () => {
  await openDemo('/unlock/ceo-ep-4');
  const episode = testCatalogue.series.episodes.find(
    (entry) => entry.id === 'ceo-ep-4',
  );
  if (!episode) throw new Error('Missing paid episode');
  const price = jest.replaceProperty(episode, 'unlockPriceCoins', 5);
  try {
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/offer has changed/i);
    expect(screen.getByText('Balance: 15 Coins')).toBeVisible();
  } finally {
    price.restore();
  }
});
