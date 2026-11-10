import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '@/features/auth/model/schema';
import { reviewSchema } from '@/features/reviews/model/schema';
import { addressSchema, cardSchema, toShippingAddress } from '../schema';

describe('storefront form schemas', () => {
  it('checks sign-in and registration fields', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'Al', email: 'a@b.co', password: 'short' }).success).toBe(false);
  });

  it('leaves empty optional address lines out of the checkout body', () => {
    const v = addressSchema.parse({
      fullName: ' Dana ', line1: '1 Main St', line2: '', city: 'Portland', state: '', postalCode: '97201', country: 'US',
    });
    expect(toShippingAddress(v)).toEqual({ fullName: 'Dana', line1: '1 Main St', city: 'Portland', postalCode: '97201', country: 'US' });
  });

  it('accepts spaced card numbers', () => {
    expect(cardSchema.safeParse({ card: '4242 4242 4242 4242', expiry: '12 / 30', cvc: '123' }).success).toBe(true);
    expect(cardSchema.safeParse({ card: '4242', expiry: '13/30', cvc: '1' }).success).toBe(false);
  });

  it('needs a star rating for a review', () => {
    expect(reviewSchema.safeParse({ rating: 0, comment: '' }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 4, comment: 'Great' }).success).toBe(true);
  });
});
