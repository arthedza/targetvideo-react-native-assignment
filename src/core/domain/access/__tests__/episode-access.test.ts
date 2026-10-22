import { getEpisodeAccess } from '../episode-access';

describe('Episode availability', () => {
  const episode = { id: 'ceo-ep-4', isFree: false, badge: 'unlocked' };
  const entitlement = {
    episodeId: episode.id,
    kind: 'episode-unlock',
    source: 'demo-coins',
  };

  it('keeps a paid episode locked despite an unlocked display badge', () => {
    expect(getEpisodeAccess(episode, [])).toBe('locked');
  });

  it.each([
    null,
    undefined,
    'unlocked',
    {},
    { episodeId: episode.id },
    { ...entitlement, episodeId: 'ceo-ep-3' },
    { ...entitlement, kind: 'badge' },
    { ...entitlement, source: 'display' },
  ])('rejects a malformed or unrelated entitlement: %p', (invalid) => {
    expect(getEpisodeAccess(episode, [invalid])).toBe('locked');
  });

  it('grants access with an entitlement for this exact episode', () => {
    expect(getEpisodeAccess(episode, [entitlement])).toBe('unlocked');
  });

  it('uses the free flag regardless of a conflicting badge', () => {
    expect(
      getEpisodeAccess({ ...episode, isFree: true, badge: 'locked' }, []),
    ).toBe('free');
  });

  it.each([
    null,
    undefined,
    [],
    {},
    { ...episode, id: '' },
    { ...episode, isFree: 'true' },
  ])('fails closed when the episode is malformed: %p', (invalid) => {
    expect(getEpisodeAccess(invalid, [entitlement])).toBe('locked');
  });

  it('fails closed when the entitlement collection is malformed', () => {
    expect(getEpisodeAccess(episode, entitlement)).toBe('locked');
  });
});
