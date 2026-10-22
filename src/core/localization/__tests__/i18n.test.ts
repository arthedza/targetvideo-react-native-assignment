import {
  formatCompactNumber,
  formatCount,
  formatNumber,
  translate,
} from '../use-i18n';

it('interpolates English messages, including a readable missing-slot fallback', () => {
  expect(translate('en', 'episodeShort', { number: 2 })).toBe('Ep 2');
  expect(Reflect.apply(translate, undefined, ['en', 'episodeShort'])).toBe(
    'Ep {number}',
  );
  expect(Reflect.apply(translate, undefined, ['en', 'episodeShort', {}])).toBe(
    'Ep {number}',
  );
});

it('uses English number formatting and singular and plural forms', () => {
  expect(formatCount('en', 1, 'coin')).toBe('1 Coin');
  expect(formatCount('en', 2, 'coin')).toBe('2 Coins');
  expect(formatCount('en', 0, 'coin')).toBe('0 Coins');
  expect(formatCount('en', 1, 'episode')).toBe('1 Episode');
  expect(formatCount('en', 4, 'episode')).toBe('4 Episodes');
  expect(formatNumber('en', 4.8)).toBe('4.8');
});

it.each([
  [999, '999'],
  [12000, '12k'],
  [1200000, '1.2m'],
  [2000000000, '2b'],
])(
  'formats compact review counts consistently on native runtimes: %s',
  (value, expected) => {
    expect(formatCompactNumber('en', value)).toBe(expected);
  },
);
