import { fireEvent, screen } from '@testing-library/react-native';

import { openDemo } from '../support/router';

describe('Choosing an episode', () => {
  it('presents the series genres, synopsis and named episode previews with a primary first-episode action', async () => {
    const app = await openDemo('/series/ceo-secret-life');
    expect(screen.getByText('Billionaire')).toBeVisible();
    expect(screen.getByText('Secret Identity')).toBeVisible();
    expect(screen.getByRole('header', { name: 'Synopsis' })).toBeVisible();
    expect(screen.getByText('1. The Accidental Message')).toBeVisible();
    expect(screen.getAllByText('0:16')).toHaveLength(2);
    expect(screen.getByText('0:12')).toBeVisible();
    expect(screen.getByText('0:14')).toBeVisible();
    await fireEvent.press(screen.getByText('Play Ep 1'));
    expect(app.getPathname()).toBe('/player/ceo-ep-1');
  });

  it('lets the viewer save and remove the selected series from the header action', async () => {
    await openDemo('/series/ceo-secret-life');
    await fireEvent.press(screen.getByRole('button', { name: 'Save series' }));
    expect(
      screen.getByRole('button', { name: 'Remove saved series' }),
    ).toBeVisible();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove saved series' }),
    );
    expect(screen.getByRole('button', { name: 'Save series' })).toBeVisible();
  });

  it('opens an already entitled episode directly without offering payment again', async () => {
    const app = await openDemo('/series/ceo-secret-life', {
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
    await fireEvent.press(
      screen.getByRole('button', { name: 'Play Episode 4' }),
    );

    expect(app.getPathname()).toBe('/player/ceo-ep-4');
  });

  it('opens a free episode without going through an unlock screen', async () => {
    const app = await openDemo('/series/ceo-secret-life');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Play Episode 1' }),
    );

    expect(app.getPathname()).toBe('/player/ceo-ep-1');
  });

  it('provides a direct shortcut to the demo cliffhanger', async () => {
    const app = await openDemo('/series/ceo-secret-life');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Watch demo cliffhanger (Ep 3)' }),
    );

    expect(app.getPathname()).toBe('/player/ceo-ep-3');
  });

  it('routes a locked episode to its unlock offer', async () => {
    const app = await openDemo('/series/ceo-secret-life');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unlock Episode 4' }),
    );

    expect(app.getPathname()).toBe('/unlock/ceo-ep-4');
  });

  it('can return to Home from a valid series', async () => {
    const app = await openDemo('/series/ceo-secret-life');
    await fireEvent.press(screen.getByRole('button', { name: 'Back to Home' }));

    expect(app.getPathname()).toBe('/');
    expect(screen.getByRole('header', { name: 'DramaFlash' })).toBeVisible();
  });
});
