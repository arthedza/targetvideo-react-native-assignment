import { quoteUnlock } from '../unlock-quote';

describe('Quoting an episode unlock', () => {
  const invalidMoney = [
    -1,
    1.5,
    NaN,
    Infinity,
    -Infinity,
    undefined,
    '15',
    Number.MAX_SAFE_INTEGER + 1,
  ];

  it.each(invalidMoney)('rejects an invalid balance: %p', (balance) => {
    expect(quoteUnlock(balance, 10)).toEqual({
      ok: false,
      reason: 'invalid-balance',
    });
  });

  it.each(invalidMoney)('rejects an invalid price: %p', (price) => {
    expect(quoteUnlock(15, price)).toEqual({
      ok: false,
      reason: 'invalid-price',
    });
  });

  it('does not offer an episode without a sale price', () => {
    expect(quoteUnlock(15, null)).toEqual({
      ok: false,
      reason: 'not-for-sale',
    });
  });

  it('quotes ten coins and five remaining without changing the wallet', () => {
    const wallet = Object.freeze({ balance: 15 });

    expect(quoteUnlock(wallet.balance, 10)).toEqual({
      ok: true,
      cost: 10,
      remaining: 5,
    });
    expect(wallet.balance).toBe(15);
  });

  it('accepts an exact balance and leaves zero', () => {
    expect(quoteUnlock(10, 10)).toEqual({ ok: true, cost: 10, remaining: 0 });
  });

  it('rejects insufficient coins without offering access', () => {
    expect(quoteUnlock(9, 10)).toEqual({
      ok: false,
      reason: 'insufficient-funds',
    });
  });

  it('supports zero-cost demo offers without making the balance negative', () => {
    expect(quoteUnlock(0, 0)).toEqual({ ok: true, cost: 0, remaining: 0 });
  });
});
