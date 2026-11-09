const formatters = new Map<string, Intl.NumberFormat>();

/** Intl formatters are costly to build; a product grid formats hundreds of prices. */
function formatter(currency: string, whole: boolean) {
  const key = `${currency}:${whole}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    formatters.set(key, f);
  }
  return f;
}

/** Formats minor units (cents) with Intl, e.g. 19900 → "$199". */
export function formatMoney(cents: number, currency = 'USD'): string {
  return formatter(currency, cents % 100 === 0).format(cents / 100);
}

/** Whole percent saved against the compare-at price, or 0 when there is no sale. */
export function discountPercent(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}
