import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Please choose a rating.').max(5),
  comment: z.string().trim().max(2000, 'Up to 2000 characters'),
});

export type ReviewValues = z.infer<typeof reviewSchema>;
