import { describe, expect, it } from 'vitest';
import { discountPercent, formatMoney } from '../money';

describe('formatMoney', () => {
  it('formats cents as dollars, hiding .00', () => {
    expect(formatMoney(19900)).toBe('$199');
    expect(formatMoney(17910)).toBe('$179.10');
    expect(formatMoney(5)).toBe('$0.05');
  });
});

describe('discountPercent', () => {
  it('rounds the saving to a whole percent and ignores non-sales', () => {
    expect(discountPercent(13200, 18800)).toBe(30);
    expect(discountPercent(19900)).toBe(0);
    expect(discountPercent(19900, 19900)).toBe(0);
  });
});
