import { fireEvent, screen } from '@testing-library/react-native';
import { Share } from 'react-native';

import { openDemo } from '../support/router';

afterEach(() => jest.restoreAllMocks());

describe('Sharing the selected story', () => {
  it('opens the native share action with the selected series title', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({
      action: Share.sharedAction,
      activityType: undefined,
    });
    await openDemo('/series/ceo-secret-life');
    await fireEvent.press(screen.getByRole('button', { name: 'Share series' }));
    expect(share).toHaveBeenCalledWith({ message: "The CEO's Secret Life" });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps the series usable when sharing is unavailable and clears feedback on retry', async () => {
    const share = jest
      .spyOn(Share, 'share')
      .mockRejectedValueOnce(new Error('Sharing unavailable'));
    await openDemo('/series/ceo-secret-life');
    await fireEvent.press(screen.getByRole('button', { name: 'Share series' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sharing is unavailable. Please try again.',
    );
    share.mockResolvedValueOnce({
      action: Share.dismissedAction,
      activityType: undefined,
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Share series' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Play Ep 1')).toBeVisible();
  });
});
