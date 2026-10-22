import { z } from 'zod';

const coins = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const localeSchema = z.literal('en');
export type Locale = z.infer<typeof localeSchema>;
export const episodeSchema = z.object({
  id: z.string().min(1),
  seriesId: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  name: z.string().min(1),
  isFree: z.boolean(),
  unlockPriceCoins: coins.nullable(),
  videoAsset: z.enum(['demo', 'garden', 'flight']),
  durationSeconds: z.number().positive(),
});
export const seriesSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  synopsis: z.string(),
  tagline: z.string(),
  genres: z.array(z.string()),
  homeGenres: z.array(z.string()),
  rating: z.number().min(0).max(5),
  ratingCount: coins,
  year: z.number().int(),
  highlights: z.array(z.string()),
  cast: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      imageKey: z.enum(['mia', 'alexander', 'chloe', 'rival']),
    }),
  ),
  episodes: z.array(episodeSchema).min(1),
});
export const catalogueSchema = z.object({
  series: seriesSchema,
  categories: z.array(
    z.object({ id: z.string(), title: z.string(), available: z.boolean() }),
  ),
  rails: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      numbers: z.array(z.number().int()),
      poster: coins,
    }),
  ),
  plans: z.array(
    z.object({
      id: z.enum(['season', 'premium']),
      title: z.string(),
      priceLabel: z.string(),
    }),
  ),
});
export type Catalogue = z.infer<typeof catalogueSchema>;
export const walletSchema = z.object({
  balanceCoins: coins,
  entitlements: z.array(
    z.object({
      episodeId: z.string().min(1),
      kind: z.literal('episode-unlock'),
      source: z.literal('demo-coins'),
      paidCoins: coins,
    }),
  ),
});
export const profileSchema = z.object({
  version: z.literal(1),
  wallet: walletSchema,
  savedSeries: z.boolean(),
  progress: z.record(z.string(), coins),
  revision: coins,
  generation: coins,
});
export const quoteSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), cost: coins, remaining: coins }),
  z.object({
    ok: z.literal(false),
    reason: z.enum([
      'invalid-balance',
      'invalid-price',
      'not-for-sale',
      'insufficient-funds',
    ]),
  }),
]);
export const offerSchema = z.object({
  episodeId: z.string().min(1),
  price: coins.nullable(),
  generation: coins,
  balanceCoins: coins,
  access: z.enum(['free', 'locked', 'unlocked']),
  quote: quoteSchema,
});
export type UnlockOffer = z.infer<typeof offerSchema>;
export const commandSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('unlock'),
      episodeId: z.string().min(1),
      price: coins.nullable(),
      generation: coins,
      idempotencyKey: z.string().min(1),
    })
    .strict(),
  z.object({ type: z.literal('save'), generation: coins }).strict(),
  z
    .object({
      type: z.literal('progress'),
      episodeId: z.string().min(1),
      seconds: coins,
      generation: coins,
    })
    .strict(),
  z.object({ type: z.literal('reset') }).strict(),
]);
export type ProfileCommand = z.infer<typeof commandSchema>;
