import type { z } from 'zod';

import type { episodeSchema, seriesSchema } from './api-schemas';

export type Episode = Readonly<z.infer<typeof episodeSchema>>;
export type Series = Readonly<z.infer<typeof seriesSchema>>;

export function getEpisode(id: unknown, series: Series): Episode | undefined {
  return series.episodes.find((episode) => episode.id === id);
}

export function getNextEpisode(
  id: string,
  series: Series,
): Episode | undefined {
  const index = series.episodes.findIndex((episode) => episode.id === id);
  if (index < 0) return undefined;

  return series.episodes[index + 1];
}

export function getRouteId(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (
    Array.isArray(value) &&
    value.length === 1 &&
    typeof value[0] === 'string'
  )
    return value[0];
  return undefined;
}
