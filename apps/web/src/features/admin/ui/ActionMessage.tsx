import type { ActionResult } from '../model/product-form';

/** The outcome of an admin action, announced to screen readers. */
export function ActionMessage({ result, className }: { result: ActionResult | null; className?: string }) {
  if (!result) return null;
  const ok = result.status === 'ok';
  return (
    <p role={ok ? 'status' : 'alert'} className={`text-[13px] ${ok ? 'text-accent' : 'text-danger'} ${className ?? ''}`}>
      {result.message}
    </p>
  );
}
