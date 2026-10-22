export const routes = {
  home: '/' as const,
  series: (seriesId: string) => ({
    pathname: '/series/[seriesId]' as const,
    params: { seriesId },
  }),
  player: (episodeId: string) => ({
    pathname: '/player/[episodeId]' as const,
    params: { episodeId },
  }),
  unlock: (episodeId: string) => ({
    pathname: '/unlock/[episodeId]' as const,
    params: { episodeId },
  }),
};
