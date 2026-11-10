'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { clientApi } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  gender: z.string().optional(),
});
type Values = z.infer<typeof schema>;

/** Email sign-up; the API adds the address to the list and sends a welcome email with an unsubscribe link. */
export function NewsletterForm({
  buttonLabel = 'Join',
  withGender = false,
  tone = 'brand',
  className,
}: {
  buttonLabel?: string;
  withGender?: boolean;
  tone?: 'brand' | 'accent';
  className?: string;
}) {
  const id = useId();
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });
  const subscribe = handleSubmit(async ({ email, gender }) => {
    setFailed(null);
    try {
      await clientApi('/newsletter', { method: 'POST', body: JSON.stringify({ email, source: gender ? `footer-${gender.startsWith('W') ? 'women' : 'men'}` : 'footer' }) });
      setDone(true);
    } catch (err) {
      setFailed(err instanceof Error ? err.message : 'Could not sign you up. Try again.');
    }
  });

  if (done) {
    return (
      <p role="status" className={cn('text-[14px] text-ink', className)}>
        Thanks — you’re on the list.
      </p>
    );
  }

  return (
    <form
      className={className}
      noValidate
      onSubmit={subscribe}
    >
      {withGender && (
        <fieldset className="mb-3 flex gap-5 text-[15px] text-ink">
          <legend className="sr-only">I shop for</legend>
          {["Men's", "Women's"].map((g) => (
            <label key={g} className="flex items-center gap-2">
              <input type="radio" {...register('gender')} value={g} className="h-[18px] w-[18px] accent-brand" />
              {g}
            </label>
          ))}
        </fieldset>
      )}
      <div className="flex gap-1">
        <label htmlFor={`${id}-email`} className="sr-only">Email address</label>
        <input
          id={`${id}-email`}
          type="email"
          {...register('email')}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${id}-error` : undefined}
          autoComplete="email"
          placeholder="Email address"
          className="h-[42px] min-w-0 flex-1 border border-ink/80 bg-white px-3 text-[15px] text-ink outline-none placeholder:text-mute focus:border-accent"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'h-[42px] shrink-0 px-5 text-[13px] font-semibold uppercase tracking-[2px] text-white transition-colors',
            tone === 'accent' ? 'bg-accent hover:bg-accent-dark' : 'bg-brand hover:bg-[#1a2b2e]',
          )}
        >
          {buttonLabel}
        </button>
      </div>
      {errors.email && <p id={`${id}-error`} className="mt-1.5 text-[13px] text-danger">{errors.email.message}</p>}
      {failed && <p role="alert" className="mt-1.5 text-[13px] text-danger">{failed}</p>}
    </form>
  );
}
