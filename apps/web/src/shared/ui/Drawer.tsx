'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * Modal side sheet: Escape and the backdrop close it, the page behind does not
 * scroll, focus moves in on open and Tab stays inside until it closes.
 */
export function Drawer({
  open,
  onClose,
  label,
  side = 'left',
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  side?: 'left' | 'right';
  className?: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const focusables = () =>
      [...(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, summary, [tabindex]:not([tabindex="-1"])') ?? [])];
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      before?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          'absolute inset-y-0 flex w-[350px] max-w-[90vw] flex-col overflow-y-auto bg-white',
          side === 'left' ? 'left-0 animate-drawer-left' : 'right-0 animate-drawer-right',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
