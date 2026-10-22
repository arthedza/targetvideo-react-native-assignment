import { act, screen, waitFor } from '@testing-library/react-native';

import { serverCatalogue } from '../../src/core/infrastructure/mock/catalogue-fixture';
import { MockApi } from '../../src/core/infrastructure/mock/mock-api';
import { openDemo } from '../support/router';

it('shows a locked preview and one selected episode offer while unavailable plans are clearly disabled', async () => {
  await openDemo('/unlock/ceo-ep-4');
  expect(screen.getByText('Continue the romance')).toBeVisible();
  expect(screen.getByLabelText('Locked episode preview')).toBeVisible();
  expect(screen.getByRole('radio', { name: 'Unlock Episode' })).toBeChecked();
  expect(
    screen.getByRole('radio', { name: 'Full season preview' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('radio', { name: 'Premium membership preview' }),
  ).toBeDisabled();
  expect(screen.getAllByText('Preview · Not available')).toHaveLength(2);
});

it('announces the same dismissal text that is visible on the offer', async () => {
  await openDemo('/unlock/ceo-ep-4');
  expect(screen.getByRole('button', { name: 'Maybe Later' })).toBeVisible();
});

it('keeps confirmation disabled until the server offer has been validated', async () => {
  const api = new MockApi();
  const offer = await api.offer('ceo-ep-4');
  let finish = () => {};
  const request = jest.spyOn(MockApi.prototype, 'offer').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = () => resolve(offer);
      }),
  );
  try {
    await openDemo('/unlock/ceo-ep-4');
    expect(
      screen.getByRole('button', { name: 'Loading offer…' }),
    ).toBeDisabled();
    await act(finish);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Unlock for 10 Coins' }),
      ).toBeEnabled(),
    );
  } finally {
    finish();
    request.mockRestore();
  }
});

it('shows an unavailable offer without suggesting a zero-price purchase', async () => {
  const episode = serverCatalogue.series.episodes.find(
    (entry) => !entry.isFree,
  );
  if (!episode) throw new Error('Missing paid episode');
  const price = jest.replaceProperty(episode, 'unlockPriceCoins', null);
  try {
    await openDemo('/unlock/ceo-ep-4');
    expect(screen.getByLabelText('Price: Unavailable')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Unlock for Unavailable' }),
    ).toBeDisabled();
  } finally {
    price.restore();
  }
});
