'use client';

import { useMemo, useState } from 'react';
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
}: {
  productId: string;
  price: number;
  variants: ProductVariant[];
  sizeNote?: string;
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

  const onAdd = async () => {
    if (!selected) {
      setMissing(true);
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
        <fieldset className="mt-5">
          <legend className={cn('text-[14.5px] text-ink', missing && 'text-danger')}>
            Size{sizeNote ? `: ${sizeNote}` : ''}
          </legend>
          <div className="mt-2.5 grid grid-cols-5 gap-1 sm:grid-cols-10" role="radiogroup" aria-label="Size">
            {sizes.map((v) => {
              const out = v.stock === 0;
              return (
                <button
                  key={v.sku}
                  type="button"
                  role="radio"
                  aria-checked={v.sku === sku}
                  aria-label={out ? `${v.size}, sold out` : v.size}
                  disabled={out}
                  onClick={() => { setSku(v.sku); setMissing(false); }}
                  className={cn(
                    'h-[50px] border border-line text-[14px] text-ink transition-colors',
                    v.sku === sku && 'border-ink outline outline-1 outline-ink',
                    out ? 'cursor-not-allowed text-[#c4c4c4] line-through' : 'hover:border-ink',
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </fieldset>
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
      <button type="button" onClick={onAdd} disabled={busy || soldOut} className="btn btn-accent mt-5 h-[46px] w-full text-[16px]" data-testid="add-to-cart">
        {soldOut ? 'Sold out' : `Add to cart — ${formatMoney(price)}`}
      </button>
      <p className="mt-[22px] text-center text-[14px] leading-6 text-ink">
        Free Shipping &amp; Returns
        <span className="block text-mute">on every order</span>
      </p>
    </div>
  );
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
