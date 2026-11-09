import { z } from 'zod';

const required = (label: string, max = 120) => z.string().trim().min(1, `Enter your ${label}`).max(max);

/** Shipping address; matches the API's checkout validation. */
export const addressSchema = z.object({
  fullName: required('full name'),
  line1: required('address', 200),
  line2: z.string().trim().max(200),
  city: required('city'),
  state: z.string().trim().max(120),
  postalCode: required('postal code', 20),
  country: required('country', 80),
});

export type AddressValues = z.infer<typeof addressSchema>;

/** The body for POST /cart/checkout: empty optional lines are left out. */
export function toShippingAddress(v: AddressValues) {
  const { line2, state, ...rest } = v;
  return { ...rest, ...(line2 ? { line2 } : {}), ...(state ? { state } : {}) };
}

const digits = (s: string) => s.replace(/\s/g, '');

/** Test-gateway card: 16 digits, an MM / YY expiry and a 3–4 digit CVC. */
export const cardSchema = z.object({
  card: z.string().refine((v) => /^\d{16}$/.test(digits(v)), 'Enter the 16 card digits'),
  expiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/, 'Use MM / YY'),
  cvc: z.string().trim().regex(/^\d{3,4}$/, '3 or 4 digits'),
});

export type CardValues = z.infer<typeof cardSchema>;
export const sameCard = (a: string, b: string) => digits(a) === digits(b);
