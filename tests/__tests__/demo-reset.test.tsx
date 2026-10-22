import { fireEvent, screen } from '@testing-library/react-native';

import { openDemo } from '../support/router';

describe('Restarting the demo', () => {
  it('restores fifteen coins and the Episode 4 lock through a visible Home action', async () => {
    await openDemo('/series/ceo-secret-life', {
      balanceCoins: 5,
      entitlements: [
        {
          episodeId: 'ceo-ep-4',
          kind: 'episode-unlock',
          source: 'demo-coins',
          paidCoins: 10,
        },
      ],
    });
    expect(
      screen.getByRole('button', { name: 'Play Episode 4' }),
    ).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Back to Home' }));
    expect(screen.getByText('5 Coins · Demo wallet')).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Reset demo' }));

    expect(screen.getByText('15 Coins · Demo wallet')).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Watch now' }));
    expect(
      screen.getByRole('button', { name: 'Unlock Episode 4' }),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Play Episode 4' })).toBeNull();
  });
});
