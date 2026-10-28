'use client';

import { useId, useState } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Email sign-up. This is a demo shop with no mailing list, so it only confirms
 * locally and never sends the address anywhere.
 */
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
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      {withGender && (
        <fieldset className="mb-3 flex gap-5 text-[15px] text-ink">
          <legend className="sr-only">I shop for</legend>
          {["Men's", "Women's"].map((g) => (
            <label key={g} className="flex items-center gap-2">
              <input type="radio" name={`${id}-gender`} value={g} className="h-[18px] w-[18px] accent-brand" />
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
          required
          autoComplete="email"
          placeholder="Email address"
          className="h-[42px] min-w-0 flex-1 border border-ink/80 bg-white px-3 text-[15px] text-ink outline-none placeholder:text-mute focus:border-accent"
        />
        <button
          type="submit"
          className={cn(
            'h-[42px] shrink-0 px-5 text-[13px] font-semibold uppercase tracking-[2px] text-white transition-colors',
            tone === 'accent' ? 'bg-accent hover:bg-accent-dark' : 'bg-brand hover:bg-[#1a2b2e]',
          )}
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
