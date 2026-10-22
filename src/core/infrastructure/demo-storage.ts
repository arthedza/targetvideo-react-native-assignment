import type { Series } from '../domain/catalogue';
import {
  createDemoProfile,
  type DemoProfile,
  parseDemoProfile,
} from '../domain/demo-profile';
import { profileStorage } from './profile-storage';

export const demoProfileKey = 'dramaflash.demo-profile.v1';
let pendingWrite = Promise.resolve();

export async function readDemoProfile(series: Series): Promise<DemoProfile> {
  await pendingWrite;
  const raw = await profileStorage.getItem(demoProfileKey);
  if (raw === null) return createDemoProfile();
  const value = parseDemoProfile(JSON.parse(raw), series);
  if (!value) throw new Error('Saved demo profile is invalid.');
  return value;
}

export function writeDemoProfile(profile: DemoProfile): Promise<void> {
  const write = pendingWrite.then(() =>
    profileStorage.setItem(demoProfileKey, JSON.stringify(profile)),
  );
  pendingWrite = write.catch(() => {});
  return write;
}
