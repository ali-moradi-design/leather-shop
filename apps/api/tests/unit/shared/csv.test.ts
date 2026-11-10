import { describe, expect, it } from 'vitest';
import { parseCsv, parseCsvObjects, toCsv } from '../../../src/shared/csv';
import { pValue } from '../../../src/modules/reporting/experiments';

describe('csv', () => {
  it('round-trips quotes, commas and new lines', () => {
    const text = toCsv(['a', 'b'], [['x, "y"', 'line\nbreak'], [1, null]]);
    expect(parseCsv(text)).toEqual([['a', 'b'], ['x, "y"', 'line\nbreak'], ['1', '']]);
  });

  it('defuses spreadsheet formulas', () => {
    expect(toCsv(['a'], [['=HYPERLINK("x")']])).toContain(`"'=HYPERLINK(""x"")"`);
  });

  it('maps rows to lower-cased headers', () => {
    expect(parseCsvObjects('Slug,Price\r\nboot,10\r\n').records).toEqual([{ slug: 'boot', price: '10' }]);
  });
});

describe('pValue', () => {
  it('is small for a clear difference and large for none', () => {
    expect(pValue(100, 1000, 150, 1000)!).toBeLessThan(0.01);
    expect(pValue(100, 1000, 102, 1000)!).toBeGreaterThan(0.5);
    expect(pValue(0, 0, 1, 1)).toBeNull();
  });
});
