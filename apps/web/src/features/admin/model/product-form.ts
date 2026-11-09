import { z } from 'zod';
import type { Product } from '@/entities/product/model/types';
import { PRODUCT_CATEGORIES, PRODUCT_GENDERS, type ProductCategory, type ProductGender } from '@/shared/config';

/** What a Server Action returns to an admin form or button. */
export type ActionResult =
  | { status: 'ok'; message: string; product?: Product }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> };

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Dollars as typed ("129" or "129.5") → cents. */
export const toCents = (dollars: string) => Math.round(Number(dollars) * 100);
const fromCents = (cents?: number) => (cents === undefined ? '' : (cents / 100).toFixed(2));

/**
 * Photos must be uploads or on the product CDN: next/image (and the CSP) only
 * load those, so any other address would break the product page.
 */
export const isAllowedImage = (v: string) => /^\/(uploads|media)\/[\w./-]+$/.test(v) || v.startsWith('https://cdn.shopify.com/s/files/');

const money = z.string().trim().regex(/^\d{1,6}(\.\d{1,2})?$/, 'Enter an amount like 129.00');
const urlName = z
  .string()
  .trim()
  .max(160)
  .regex(/^[a-z0-9-]*$/, 'Use lowercase letters, digits and dashes');
const short = (max: number) => z.string().trim().max(max);

/** The product form, as the admin types it. Empty optional fields are derived. */
export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a name').max(120),
    color: z.string().trim().min(1, 'Enter a color').max(80),
    title: short(200),
    slug: urlName,
    style: urlName,
    colorFamily: short(40),
    colorGroup: short(80),
    category: z.enum(PRODUCT_CATEGORIES, { error: 'Choose a category' }),
    gender: z.enum(PRODUCT_GENDERS, { error: 'Choose who it is for' }),
    description: short(5000),
    features: short(4000),
    leather: short(80),
    construction: short(80),
    sole: short(80),
    price: money,
    compareAtPrice: money.or(z.literal('')),
    tags: short(800),
    featured: z.boolean(),
    images: z
      .array(
        z.object({
          url: z
            .string()
            .trim()
            .refine(isAllowedImage, 'Upload the photo, or use a cdn.shopify.com address'),
        }),
      )
      .max(20, 'Up to 20 photos'),
    variants: z
      .array(
        z.object({
          size: z.string().trim().min(1, 'Enter a size').max(20),
          width: short(20),
          sku: short(80),
          stock: z.number({ error: 'Enter a number' }).int('Whole numbers only').min(0, '0 or more'),
        }),
      )
      .min(1, 'Add at least one size')
      .max(40, 'Up to 40 sizes'),
  })
  .superRefine((v, ctx) => {
    if (v.compareAtPrice && toCents(v.compareAtPrice) <= toCents(v.price)) {
      ctx.addIssue({ code: 'custom', path: ['compareAtPrice'], message: 'Must be higher than the price' });
    }
    const skus = deriveVariants(v).map((x) => x.sku);
    skus.forEach((sku, i) => {
      if (skus.indexOf(sku) !== i) {
        ctx.addIssue({ code: 'custom', path: ['variants', i, 'sku'], message: 'Each size needs its own SKU' });
      }
    });
  });

export type ProductFormValues = z.input<typeof productFormSchema>;

/** The body the API's POST/PATCH /products expects. Money in cents. */
export interface ProductPayload {
  slug: string;
  title: string;
  name: string;
  style: string;
  color: string;
  colorFamily: string;
  colorGroup?: string;
  category: ProductCategory;
  gender: ProductGender;
  description: string;
  features: string[];
  leather?: string;
  construction?: string;
  sole?: string;
  price: number;
  /** null clears the sale price on an update. */
  compareAtPrice: number | null;
  images: string[];
  variants: { sku: string; size: string; width?: string; stock: number }[];
  tags: string[];
  featured: boolean;
}

/** URL and style prefix of the seeded catalog ("mens-…", "womens-…"); unisex has none. */
const genderPrefix = (g: string) => (g === 'men' || g === 'women' ? `${g}s-` : '');

export const deriveSlug = (v: Pick<ProductFormValues, 'slug' | 'name' | 'color' | 'gender'>) =>
  slugify(v.slug || `${genderPrefix(v.gender)}${v.name}-${v.color}`);

function deriveVariants(v: ProductFormValues) {
  const slug = deriveSlug(v);
  return v.variants.map((x) => ({
    size: x.size.trim(),
    width: x.width.trim() || undefined,
    stock: x.stock,
    sku: (x.sku.trim() || `${slug}-${x.size}${x.width ? `-${x.width}` : ''}`).toUpperCase().replace(/[^A-Z0-9.-]+/g, '-'),
  }));
}

const orUndefined = (s: string) => s.trim() || undefined;

/** Fills in the derived fields (slug, title, style, SKUs) and converts money to cents. */
export function toProductPayload(v: ProductFormValues): ProductPayload {
  const name = v.name.trim();
  const color = v.color.trim();
  return {
    slug: deriveSlug(v),
    title: v.title.trim() || `${name} | ${color}`,
    name,
    style: slugify(v.style || `${genderPrefix(v.gender)}${name}`),
    color,
    colorFamily: v.colorFamily.trim() || color,
    colorGroup: orUndefined(v.colorGroup),
    category: v.category as ProductCategory,
    gender: v.gender as ProductGender,
    description: v.description.trim(),
    features: v.features.split('\n').map((f) => f.trim()).filter(Boolean),
    leather: orUndefined(v.leather),
    construction: orUndefined(v.construction),
    sole: orUndefined(v.sole),
    price: toCents(v.price),
    compareAtPrice: v.compareAtPrice ? toCents(v.compareAtPrice) : null,
    images: v.images.map((i) => i.url.trim()).filter(Boolean),
    variants: deriveVariants(v).map(({ width, ...x }) => (width ? { ...x, width } : x)),
    tags: v.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
    featured: v.featured,
  };
}

/** Form defaults: the product being edited, or an empty product. */
export function productToFormValues(p?: Product): ProductFormValues {
  return {
    name: p?.name ?? '',
    color: p?.color ?? '',
    title: p?.title ?? '',
    slug: p?.slug ?? '',
    style: p?.style ?? '',
    colorFamily: p?.colorFamily ?? '',
    colorGroup: p?.colorGroup ?? '',
    category: p?.category ?? 'boots',
    gender: p?.gender ?? 'men',
    description: p?.description ?? '',
    features: p?.features.join('\n') ?? '',
    leather: p?.leather ?? '',
    construction: p?.construction ?? '',
    sole: p?.sole ?? '',
    price: p ? fromCents(p.price) : '',
    compareAtPrice: fromCents(p?.compareAtPrice),
    tags: p?.tags.join(', ') ?? '',
    featured: p?.featured ?? false,
    images: p?.images.map((url) => ({ url })) ?? [],
    variants: p?.variants.map((x) => ({ size: x.size, width: x.width ?? '', sku: x.sku, stock: x.stock })) ?? [
      { size: 'One Size', width: '', sku: '', stock: 0 },
    ],
  };
}

/** Discount code form. Fixed amounts are typed in dollars. */
export const discountFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,50}$/, 'Use 3–50 letters, digits, dashes or underscores'),
    type: z.enum(['percent', 'fixed']),
    value: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Enter a number'),
    minOrderAmount: money.or(z.literal('')),
    maxUses: z.string().trim().regex(/^\d*$/, 'Whole numbers only'),
    endsAt: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Pick a date'),
  })
  .superRefine((v, ctx) => {
    const n = Number(v.value);
    if (n <= 0 || (v.type === 'percent' && n > 100)) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: v.type === 'percent' ? 'Enter 1 to 100 percent' : 'Enter an amount above 0',
      });
    }
  });

export type DiscountFormValues = z.input<typeof discountFormSchema>;

/** First message per field, keyed by dotted path ("variants.0.sku"). */
export function issuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'root';
    out[key] ??= issue.message;
  }
  return out;
}
