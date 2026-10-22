export type EpisodeAccess = 'free' | 'locked' | 'unlocked';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getEpisodeAccess(
  episode: unknown,
  entitlements: unknown,
): EpisodeAccess {
  if (
    !isRecord(episode) ||
    typeof episode.id !== 'string' ||
    episode.id.trim() === '' ||
    typeof episode.isFree !== 'boolean'
  ) {
    return 'locked';
  }

  if (episode.isFree) return 'free';
  if (!Array.isArray(entitlements)) return 'locked';

  const grants: readonly unknown[] = entitlements;
  const isUnlocked = grants.some(
    (grant) =>
      isRecord(grant) &&
      grant.episodeId === episode.id &&
      grant.kind === 'episode-unlock' &&
      grant.source === 'demo-coins',
  );

  return isUnlocked ? 'unlocked' : 'locked';
}
