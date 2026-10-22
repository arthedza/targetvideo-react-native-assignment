import { fireEvent, render, screen } from '@testing-library/react-native';

import { createDemoWallet } from '../../src/core/domain/access/demo-wallet';
import { serverCatalogue as testCatalogue } from '../../src/core/infrastructure/mock/catalogue-fixture';
import { HomeRails } from '../../src/features/home/home-rails';
import { openDemo } from '../support/router';

describe('Discovering the available demo chapters', () => {
  it('offers playable chapter cards and keeps the paid chapter gated', async () => {
    const app = await openDemo('/');
    const card = screen.getAllByRole('button', {
      name: 'Play The Accidental Message',
    })[0];
    if (!card) throw new Error('The free chapter card is missing.');
    await fireEvent.press(card);
    expect(app.getPathname()).toBe('/player/ceo-ep-1');
  });

  it('opens the unlock offer from a locked chapter card', async () => {
    const app = await openDemo('/');
    const card = screen.getAllByRole('button', {
      name: 'Unlock The Gala Encounter',
    })[0];
    if (!card) throw new Error('The locked chapter card is missing.');
    await fireEvent.press(card);
    expect(app.getPathname()).toBe('/unlock/ceo-ep-4');
  });

  it('filters the visible collection and recovers from a search without results', async () => {
    await openDemo('/');
    await fireEvent.press(screen.getByRole('button', { name: 'Romance' }));
    expect(
      screen.getByRole('button', { name: 'Romance', selected: true }),
    ).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Action' }));
    expect(screen.getByText('No chapters in this category yet.')).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'All' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Search episodes' }),
    );
    await fireEvent.changeText(
      screen.getByLabelText('Search chapters'),
      'missing',
    );
    expect(screen.getByText('No matching chapters.')).toBeVisible();
    await fireEvent.changeText(
      screen.getByLabelText('Search chapters'),
      'Coffee',
    );
    expect(screen.getAllByText('Coffee and Contracts').length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByRole('button', { name: 'Play The Accidental Message' }),
    ).toBeNull();
    await fireEvent.changeText(
      screen.getByLabelText('Search chapters'),
      'Gala',
    );
    expect(
      screen.getAllByRole('button', { name: 'Unlock The Gala Encounter' })
        .length,
    ).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Close search' }));
    expect(
      screen.getAllByRole('button', { name: 'Play The Accidental Message' })
        .length,
    ).toBeGreaterThan(0);
  });

  it('returns Home through the bottom bar and clearly disables future destination previews', async () => {
    const app = await openDemo('/series/ceo-secret-life');
    await fireEvent.press(screen.getByRole('button', { name: 'Home' }));
    expect(app.getPathname()).toBe('/');
    await fireEvent.press(screen.getByRole('button', { name: 'Home' }));
    expect(
      screen.getByRole('button', { name: 'Discover preview' }),
    ).toBeDisabled();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Discover preview' }),
    );
    expect(app.getPathname()).toBe('/');
  });

  it('keeps the saved state consistent between Home and series details, and clears it on reset', async () => {
    await openDemo('/');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Add to watchlist' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Watch now' }));
    expect(
      screen.getByRole('button', { name: 'Remove saved series' }),
    ).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Back to Home' }));
    expect(
      screen.getByRole('button', { name: 'Remove from watchlist' }),
    ).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Reset demo' }));
    expect(
      screen.getByRole('button', { name: 'Add to watchlist' }),
    ).toBeVisible();
  });
});

it('shows the catalogue price on every locked Home card', async () => {
  const paid = testCatalogue.series.episodes.find((episode) => !episode.isFree);
  if (!paid) throw new Error('Expected a paid demo episode.');
  await render(
    <HomeRails
      rails={testCatalogue.rails}
      episodes={[{ ...paid, unlockPriceCoins: 25 }]}
      wallet={createDemoWallet()}
      onEpisode={jest.fn()}
      onSeeAll={jest.fn()}
    />,
  );
  expect(screen.getAllByText('25 COINS')).toHaveLength(2);
});

it('marks a paid chapter unavailable when it is not for sale', async () => {
  const paid = testCatalogue.series.episodes.find((episode) => !episode.isFree);
  if (!paid) throw new Error('Missing paid chapter');
  await render(
    <HomeRails
      rails={testCatalogue.rails}
      episodes={[{ ...paid, unlockPriceCoins: null }]}
      wallet={createDemoWallet()}
      onEpisode={jest.fn()}
      onSeeAll={jest.fn()}
    />,
  );
  expect(screen.getAllByText('UNAVAILABLE')).toHaveLength(2);
});
