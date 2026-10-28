import { cn } from '../lib/cn';

/** A shimmering placeholder block; size it with classes. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}
