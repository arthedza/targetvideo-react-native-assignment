import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { Screen } from '../../src/ui/screen';
import { openDemo } from '../support/router';

afterEach(() => jest.restoreAllMocks());

it('keeps the Home header outside the scrolling catalogue', async () => {
  await openDemo('/');
  let parent = screen.getByRole('header', { name: 'DramaFlash' }).parent;
  while (parent !== null) {
    expect(parent.type).not.toBe('RCTScrollView');
    parent = parent.parent;
  }
});

it('covers scrolling content under the real system inset without covering fixed player controls', async () => {
  const app = await render(
    <SafeAreaInsetsContext.Provider value={insets}>
      <Screen fullBleed>
        <Text>Scrollable content</Text>
      </Screen>
    </SafeAreaInsetsContext.Provider>,
  );
  expect(screen.getByTestId('system-inset-cover')).toHaveStyle({ height: 0 });
  await fireEvent.scroll(screen.getByTestId('page-scroll'), {
    nativeEvent: { contentOffset: { y: 120 } },
  });
  expect(screen.getByTestId('system-inset-cover')).toHaveStyle({ height: 62 });
  await fireEvent.scroll(screen.getByTestId('page-scroll'), {
    nativeEvent: { contentOffset: { y: 0 } },
  });
  expect(screen.getByTestId('system-inset-cover')).toHaveStyle({ height: 0 });
  await app.rerender(
    <SafeAreaInsetsContext.Provider value={insets}>
      <Screen fullBleed scrollable={false}>
        <Text>Player controls</Text>
      </Screen>
    </SafeAreaInsetsContext.Provider>,
  );
  expect(screen.getByTestId('system-inset-cover')).toHaveStyle({ height: 0 });
  expect(screen.getByText('Player controls')).toBeVisible();
});

const insets = { top: 62, bottom: 34, left: 0, right: 0 };
