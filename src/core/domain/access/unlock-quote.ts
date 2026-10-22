export type UnlockQuote =
  | Readonly<{ ok: true; cost: number; remaining: number }>
  | Readonly<{
      ok: false;
      reason:
        | 'invalid-balance'
        | 'invalid-price'
        | 'not-for-sale'
        | 'insufficient-funds';
    }>;

export function isCoinAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function quoteUnlock(balance: unknown, price: unknown): UnlockQuote {
  if (!isCoinAmount(balance)) return { ok: false, reason: 'invalid-balance' };
  if (price === null) return { ok: false, reason: 'not-for-sale' };
  if (!isCoinAmount(price)) return { ok: false, reason: 'invalid-price' };
  if (balance < price) return { ok: false, reason: 'insufficient-funds' };

  return { ok: true, cost: price, remaining: balance - price };
}
