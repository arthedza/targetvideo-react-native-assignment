import * as SecureStore from 'expo-secure-store';

import { profileStorage } from '../profile-storage';

it('reads and writes the native secure profile without another storage adapter', async () => {
  expect(await profileStorage.getItem('secure-profile')).toBeNull();
  await profileStorage.setItem('secure-profile', 'profile');
  expect(await profileStorage.getItem('secure-profile')).toBe('profile');
  await SecureStore.deleteItemAsync('secure-profile');
});

it('propagates secure storage failures so access cannot be granted from a failed write', async () => {
  jest
    .spyOn(SecureStore, 'setItemAsync')
    .mockRejectedValueOnce(new Error('Locked'));
  await expect(
    profileStorage.setItem('secure-profile', 'profile'),
  ).rejects.toThrow('Locked');
  expect(await profileStorage.getItem('secure-profile')).toBeNull();
});
