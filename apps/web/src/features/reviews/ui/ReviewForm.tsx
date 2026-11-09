'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ApiError } from '@/shared/api/types';
import { clientApi } from '@/shared/api/client';
import { Icon } from '@/shared/ui/Icon';
import { reviewSchema, type ReviewValues } from '../model/schema';

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<'idle' | 'done' | 'login'>('idle');
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewValues>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 0, comment: '' } });
  const rating = useWatch({ control, name: 'rating' });

  const onSubmit = handleSubmit(async ({ rating: stars, comment }) => {
    setError(null);
    try {
      await clientApi('/reviews', {
        method: 'POST',
        body: JSON.stringify({ product: productId, rating: stars, ...(comment && { comment }) }),
      });
      setState('done');
      // same page: refresh the server parts so the new review and rating show
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return setState('login');
      setError(err instanceof Error ? err.message : 'Could not save your review');
    }
  });

  if (state === 'done') return <p role="status" className="text-[14px]">Thanks for your review!</p>;
  if (state === 'login') {
    return (
      <p className="text-[14px]">
        Please <Link className="link-underline" href={`/account/login?next=${encodeURIComponent(pathname + '#reviews')}`}>sign in</Link> to write a review.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-3 text-[14px]">
      <fieldset>
        <legend className="mb-1">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={rating === n}
              onClick={() => setValue('rating', n, { shouldValidate: true })}
            >
              <Icon name="star" width={24} height={24} fill={n <= rating ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        {errors.rating && <p role="alert" className="mt-1 text-danger">{errors.rating.message}</p>}
      </fieldset>
      <label className="block">
        Your review (optional)
        <textarea {...register('comment')} rows={4} maxLength={2000} className="mt-1 block w-full border border-line p-3 outline-none focus:border-ink" />
      </label>
      {errors.comment && <p className="text-danger">{errors.comment.message}</p>}
      {error && <p role="alert" className="text-danger">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="btn">Submit review</button>
    </form>
  );
}
