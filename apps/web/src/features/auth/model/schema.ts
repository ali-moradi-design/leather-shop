import { z } from 'zod';

const email = z.string().trim().min(1, 'Enter your email').email('Enter a valid email address');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});

/** Mirrors the API's register rules (name 2–100, password 8–128). */
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100),
  email,
  password: z.string().min(8, 'Use at least 8 characters').max(128),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
