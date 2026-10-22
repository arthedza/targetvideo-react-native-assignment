import { fireEvent, screen } from '@testing-library/react-native';

import { openDemo } from '../support/router';

describe('Discovering a short drama', () => {
  it('opens the featured series from the main Watch now action', async () => {
    const app = await openDemo('/');
    await fireEvent.press(screen.getByRole('button', { name: 'Watch now' }));

    expect(app.getPathname()).toBe('/series/ceo-secret-life');
    expect(
      screen.getByRole('header', { name: "The CEO's Secret Life" }),
    ).toBeVisible();
    expect(screen.getByLabelText('4 episodes · 3 free')).toBeVisible();
  });

  it('shows a safe recovery path for an unknown series', async () => {
    const app = await openDemo('/series/missing');

    expect(
      screen.getByRole('header', { name: 'Series not found' }),
    ).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Back to Home' }));
    expect(app.getPathname()).toBe('/');
  });

  it('keeps the title and navigation usable when artwork cannot load', async () => {
    const app = await openDemo('/');
    await fireEvent(screen.getByLabelText('Series cover'), 'error', {
      nativeEvent: { error: 'Artwork unavailable' },
    });

    expect(screen.getByText('Artwork unavailable')).toBeVisible();
    expect(
      screen.getByRole('header', { name: "The CEO's Secret Life" }),
    ).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Watch now' }));
    expect(app.getPathname()).toBe('/series/ceo-secret-life');
  });
});

it('keeps review and episode metadata compact without losing the available episode count', async () => {
  await openDemo('/series/ceo-secret-life');
  expect(screen.getByText('(12k)')).toBeVisible();
  expect(screen.getByText('4 Eps')).toBeVisible();
  expect(screen.getByLabelText('4 episodes · 3 free')).toBeVisible();
});

it('allows complete cast names and roles to wrap instead of truncating them', async () => {
  await openDemo('/series/ceo-secret-life');
  for (const label of [
    'Julian Vance',
    'Alexander (CEO)',
    'Chloe (Best Friend)',
  ]) {
    const text = screen.getByText(label);
    expect(text).toBeVisible();
    expect(text.props.numberOfLines).toBeUndefined();
  }
});
