import Link from 'next/link';
import { discountPercent, formatMoney } from '@/shared/lib/money';
import type { Product } from '../model/types';
import { CardPhotos } from './CardPhotos';

/**
 * Grid tile: light grey square image, name + price, color below (like the mockup).
 * `preload` the first row of a grid: those photos are the largest paint above the fold.
 */
export function ProductCard({ product, preload }: { product: Product; preload?: boolean }) {
  const soldOut = product.stock === 0;
  const off = discountPercent(product.price, product.compareAtPrice);
  return (
    <Link href={`/products/${product.slug}`} className="group block" data-testid="product-card">
      <CardPhotos first={product.images[0]} second={product.images[1]} alt={product.title} preload={preload} />
      <div className="mt-[14px] flex justify-between gap-3 text-[15px] leading-[22px] text-ink">
        <span className="group-hover:underline group-hover:underline-offset-2">{product.name}</span>
        <span className="shrink-0">
          {product.compareAtPrice && (
            <s className="mr-2 text-mute">{formatMoney(product.compareAtPrice, product.currency)}</s>
          )}
          {formatMoney(product.price, product.currency)}
        </span>
      </div>
      <div className="mt-0.5 text-[15px] leading-[22px] text-mute">{product.color}</div>
      {soldOut || product.tags.includes('new-arrival') ? (
        <span className="mt-2 inline-block bg-mute px-2 py-[3px] text-[13px] leading-[18px] text-white">
          {soldOut ? 'Sold Out' : 'New Arrival'}
        </span>
      ) : off > 0 ? (
        <span className="mt-2 inline-block bg-danger px-2 py-[3px] text-[13px] leading-[18px] text-white">{off}% off</span>
      ) : null}
    </Link>
  );
}
