import { describe, expect, it } from 'vitest';
import {
  discountFormSchema,
  issuesToFieldErrors,
  productFormSchema,
  productToFormValues,
  slugify,
  toProductPayload,
  type ProductFormValues,
} from '../product-form';

const base: ProductFormValues = {
  ...productToFormValues(),
  name: 'Arden',
  color: 'Dark Brown',
  category: 'boots',
  gender: 'women',
  price: '235',
  variants: [
    { size: '7', width: '', sku: '', stock: 3 },
    { size: '8', width: 'Wide', sku: 'ARD-8W', stock: 0 },
  ],
};

describe('productFormSchema + toProductPayload', () => {
  it('derives slug, title, style and SKUs like the seeded catalog', () => {
    const parsed = productFormSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    expect(toProductPayload(base)).toMatchObject({
      slug: 'womens-arden-dark-brown',
      title: 'Arden | Dark Brown',
      style: 'womens-arden',
      colorFamily: 'Dark Brown',
      price: 23500,
      compareAtPrice: null,
      variants: [
        { sku: 'WOMENS-ARDEN-DARK-BROWN-7', size: '7', stock: 3 },
        { sku: 'ARD-8W', size: '8', width: 'Wide', stock: 0 },
      ],
    });
  });

  it('reports each invalid field by its path', () => {
    const parsed = productFormSchema.safeParse({
      ...base,
      name: '',
      price: 'x',
      variants: [{ size: '7', width: '', sku: '', stock: -1 }],
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(Object.keys(issuesToFieldErrors(parsed.error)).sort()).toEqual(['name', 'price', 'variants.0.stock']);
  });

  it('rejects duplicate SKUs and a compare-at price at or below the price', () => {
    const parsed = productFormSchema.safeParse({
      ...base,
      compareAtPrice: '235',
      variants: [
        { size: '7', width: '', sku: 'SAME', stock: 1 },
        { size: '8', width: '', sku: 'same', stock: 1 },
      ],
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const errors = issuesToFieldErrors(parsed.error);
    expect(errors['variants.1.sku']).toMatch(/own SKU/);
    expect(errors.compareAtPrice).toBeTruthy();
  });

  it('splits features by line and tags by comma', () => {
    const payload = toProductPayload({ ...base, features: 'One\n\n Two ', tags: 'New-Arrival, gift' });
    expect(payload.features).toEqual(['One', 'Two']);
    expect(payload.tags).toEqual(['new-arrival', 'gift']);
  });

  it('round-trips an existing product', () => {
    const values = productToFormValues({
      id: '1', slug: 'mens-captain-tobacco', title: 'Captain | Tobacco', name: 'Captain', style: 'mens-captain',
      color: 'Tobacco', colorFamily: 'Brown', category: 'boots', gender: 'men', description: '', features: ['A'],
      price: 19900, compareAtPrice: 24900, currency: 'USD', images: ['https://cdn.shopify.com/s/files/x.jpg'],
      variants: [{ sku: 'CAP-10', size: '10', stock: 5 }], stock: 5, tags: [], featured: true,
      ratingAvg: 0, ratingCount: 0, createdAt: '', updatedAt: '',
    });
    expect(productFormSchema.safeParse(values).success).toBe(true);
    expect(toProductPayload(values)).toMatchObject({ price: 19900, compareAtPrice: 24900, featured: true });
  });
});

describe('discountFormSchema', () => {
  it('upper-cases the code and caps percent discounts at 100', () => {
    const ok = discountFormSchema.parse({ code: 'spring-25', type: 'percent', value: '25', minOrderAmount: '', maxUses: '', endsAt: '' });
    expect(ok.code).toBe('SPRING-25');
    expect(
      discountFormSchema.safeParse({ code: 'BIG', type: 'percent', value: '150', minOrderAmount: '', maxUses: '', endsAt: '' }).success,
    ).toBe(false);
  });
});

describe('slugify', () => {
  it('keeps lowercase letters, digits and single dashes', () => {
    expect(slugify('  Café — Noir 2 ')).toBe('cafe-noir-2');
  });
});
