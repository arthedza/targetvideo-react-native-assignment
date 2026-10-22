import '@formatjs/intl-getcanonicallocales/polyfill-force.js';
import '@formatjs/intl-locale/polyfill-force.js';
import '@formatjs/intl-pluralrules/polyfill-force.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';

import { useCallback } from 'react';

import type { Locale } from '../domain/api-schemas';
import { en } from './en';

export const defaultLocale: Locale = 'en';

export type MessageKey = keyof typeof en;
type Slots<S extends string> = S extends `${string}{${infer Key}}${infer Rest}`
  ? Key | Slots<Rest>
  : never;
type Arguments<K extends MessageKey> = [Slots<(typeof en)[K]>] extends [never]
  ? []
  : [values: Record<Slots<(typeof en)[K]>, string | number>];

export function translate<K extends MessageKey>(
  locale: Locale,
  key: K,
  ...args: Arguments<K>
): string {
  const messages: Readonly<Record<Locale, typeof en>> = { en };
  const template = messages[locale][key];
  return template.replace(/\{(\w+)\}/g, (_match, slot: string) => {
    const values: Readonly<Record<string, string | number>> = args[0] ?? {};
    return String(values[slot] ?? `{${slot}}`);
  });
}

export function formatNumber(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
    value,
  );
}
const compactUnits = [
  { value: 1e9, suffix: 'b' },
  { value: 1e6, suffix: 'm' },
  { value: 1e3, suffix: 'k' },
] as const;

export function formatCompactNumber(locale: Locale, value: number) {
  const unit = compactUnits.find((entry) => Math.abs(value) >= entry.value);
  return unit
    ? `${formatNumber(locale, value / unit.value)}${unit.suffix}`
    : formatNumber(locale, value);
}
export function formatCount(
  locale: Locale,
  value: number,
  kind: 'coin' | 'episode',
) {
  const rule = new Intl.PluralRules(locale).select(value);
  const suffixes = {
    one: 'One',
    few: 'Few',
    many: 'Many',
    other: 'Other',
    zero: 'Other',
    two: 'Other',
  } as const;
  const suffix = suffixes[rule];
  const noun = translate(locale, `${kind}${suffix}`);
  return `${formatNumber(locale, value)} ${noun}`;
}
export function useI18n() {
  const locale = defaultLocale;
  const t = useCallback(
    <K extends MessageKey>(key: K, ...args: Arguments<K>) =>
      translate(locale, key, ...args),
    [locale],
  );
  const coins = useCallback(
    (value: number) => formatCount(locale, value, 'coin'),
    [locale],
  );
  const number = useCallback(
    (value: number) => formatNumber(locale, value),
    [locale],
  );
  const compactNumber = useCallback(
    (value: number) => formatCompactNumber(locale, value),
    [locale],
  );
  const episodes = useCallback(
    (value: number) => formatCount(locale, value, 'episode'),
    [locale],
  );
  return { locale, t, coins, number, compactNumber, episodes };
}
