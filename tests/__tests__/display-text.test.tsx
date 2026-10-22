import { render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';

import { DisplayText } from '../../src/ui/display-text';
import { openDemo } from '../support/router';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));

it.each([
  { name: 'loading', loaded: false, error: null, family: 'Georgia' },
  {
    name: 'failed',
    loaded: false,
    error: new Error('Font unavailable'),
    family: 'Georgia',
  },
  { name: 'ready', loaded: true, error: null, family: 'Display' },
])(
  'keeps the root-provided headings readable when the local font is $name',
  async ({ loaded, error, family }) => {
    jest.mocked(useFonts).mockReturnValue([loaded, error]);
    await openDemo('/series/ceo-secret-life');
    expect(
      screen.getByRole('header', { name: "The CEO's Secret Life" }),
    ).toHaveStyle({ fontFamily: family });
  },
);

it('does not load the same font separately for each heading', async () => {
  jest.mocked(useFonts).mockClear().mockReturnValue([false, null]);
  await render(
    <>
      <DisplayText>First heading</DisplayText>
      <DisplayText>Second heading</DisplayText>
    </>,
  );
  expect(screen.getByText('First heading')).toHaveStyle({
    fontFamily: 'Georgia',
  });
  expect(useFonts).not.toHaveBeenCalled();
});
