'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ProductVariant } from '@/entities/product/model/types';
import { useCart } from '@/features/cart';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/money';

/** Width toggle, size grid with live stock, and the add-to-cart button. */
export function BuyBox({
  productId,
  price,
  variants,
  sizeNote,
  sizeGuide,
  title,
}: {
  productId: string;
  price: number;
  variants: ProductVariant[];
  sizeNote?: string;
  /** The "Size guide" link and dialog, rendered by the page. */
  sizeGuide?: ReactNode;
  /** Shown in the phone's sticky bar. */
  title?: string;
}) {
  const { add, busy } = useCart();
  const widths = useMemo(() => [...new Set(variants.map((v) => v.width).filter(Boolean))] as string[], [variants]);
  const [width, setWidth] = useState<string | undefined>(widths[0]);
  const sizes = variants.filter((v) => !widths.length || v.width === width);
  const oneSize = sizes.length === 1 && sizes[0].size === 'One Size';
  const [sku, setSku] = useState<string | undefined>(oneSize ? sizes[0].sku : undefined);
  const [missing, setMissing] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const selected = variants.find((v) => v.sku === sku);
  const soldOut = variants.every((v) => v.stock === 0);

  const sizesRef = useRef<HTMLFieldSetElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const showBar = useScrolledPast(buttonRef);

  const onAdd = async () => {
    if (!selected) {
      setMissing(true);
      sizesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setAddError(null);
    await add(productId, selected.sku).catch((err: unknown) =>
      setAddError(err instanceof Error ? err.message : 'Could not add to cart'),
    );
  };

  return (
    <div>
      {widths.length > 1 && (
        <fieldset className="mt-4 flex flex-wrap items-end gap-x-3 border-b border-line text-[14.5px]">
          <legend className="float-left mr-1 pb-2 text-ink">Width:</legend>
          {widths.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={w === width}
              onClick={() => { setWidth(w); setSku(undefined); }}
              className={cn(
                '-mb-px border-b-2 pb-2 transition-colors',
                w === width ? 'border-ink text-ink' : 'border-transparent text-mute hover:text-ink',
              )}
            >
              {w}
            </button>
          ))}
        </fieldset>
      )}
      {!oneSize && (
        <fieldset ref={sizesRef} className="mt-5 scroll-mt-32">
          <div className="flex items-start justify-between gap-4">
            <legend className={cn('float-left text-[14.5px] text-ink', missing && 'text-danger')}>
              Size{sizeNote ? `: ${sizeNote}` : ''}
            </legend>
            {sizeGuide && <span className="shrink-0">{sizeGuide}</span>}
          </div>
          <div className="mt-2.5 grid grid-cols-5 gap-1 sm:grid-cols-10" role="radiogroup" aria-label="Size">
            {sizes.map((v) => {
              const out = v.stock === 0;
              const few = !out && v.stock <= 3;
              return (
                <button
                  key={v.sku}
                  type="button"
                  role="radio"
                  aria-checked={v.sku === sku}
                  aria-label={out ? `${v.size}, sold out` : few ? `${v.size}, only ${v.stock} left` : v.size}
                  disabled={out}
                  onClick={() => { setSku(v.sku); setMissing(false); }}
                  className={cn(
                    'relative h-[50px] border border-line text-[14px] text-ink transition-colors',
                    v.sku === sku && 'border-ink outline outline-1 outline-ink',
                    out ? 'cursor-not-allowed text-[#c4c4c4] line-through' : 'hover:border-ink',
                  )}
                >
                  {v.size}
                  {few && <span aria-hidden className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warn" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {sizes.some((v) => v.stock > 0 && v.stock <= 3) && !oneSize && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-mute">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warn" /> Only a few left
        </p>
      )}
      {missing && (
        <p role="alert" className="mt-3 border-t border-danger pt-1 text-[13px] text-danger">Please select a size</p>
      )}
      {selected && selected.stock > 0 && selected.stock <= 3 && (
        <p className="mt-3 text-[13px]">Only {selected.stock} left in this size.</p>
      )}
      {addError && (
        <p role="alert" className="mt-3 text-[13px] text-danger">{addError}</p>
      )}
      <button ref={buttonRef} type="button" onClick={onAdd} disabled={busy || soldOut} className="btn btn-accent mt-5 h-[46px] w-full text-[16px]" data-testid="add-to-cart">
        {soldOut ? 'Sold out' : `Add to cart — ${formatMoney(price)}`}
      </button>
      <p className="mt-[22px] text-center text-[14px] leading-6 text-ink">
        Free Shipping &amp; Returns
        <span className="block text-mute">on every order</span>
      </p>
      {showBar && !soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex animate-fade-in items-center gap-3 border-t border-line bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
          <span className="min-w-0 flex-1 text-[14px] leading-tight">
            <span className="block truncate text-ink">{title}</span>
            <span className="text-mute">{selected ? `Size ${selected.size} · ` : ''}{formatMoney(price)}</span>
          </span>
          <button type="button" onClick={onAdd} disabled={busy} className="btn btn-accent h-11 shrink-0 px-5 text-[13px]">
            {selected ? 'Add to cart' : 'Choose size'}
          </button>
        </div>
      )}
    </div>
  );
}

/** True once the element has scrolled up out of view (for the phone's sticky add-to-cart bar). */
function useScrolledPast(ref: React.RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The root reaches far below the screen, so only crossing the top edge counts:
    // an element below the fold still "intersects", one scrolled above it does not.
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting), { rootMargin: '0px 0px 100000px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return past;
}

export function BuyBoxSkeleton() {
  return (
    <div aria-hidden className="mt-5">
      <div className="skeleton h-4 w-40" />
      <div className="mt-3 grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => <div key={i} className="skeleton h-[50px]" />)}
      </div>
      <div className="skeleton mt-5 h-[46px]" />
    </div>
  );
}
