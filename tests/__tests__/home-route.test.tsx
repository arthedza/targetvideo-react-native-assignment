import { screen } from '@testing-library/react-native';

import { openDemo } from '../support/router';

describe('Opening DramaFlash', () => {
  it('identifies the app with an accessible heading', async () => {
    await openDemo('/');

    expect(screen.getByRole('header', { name: 'DramaFlash' })).toBeVisible();
  });
});
