import Image from 'next/image';
import Link from 'next/link';
import { discountPercent, formatMoney } from '@/shared/lib/money';
import type { Product } from '../model/types';

/** Grid tile: light grey square image, name + price, color below (like the mockup). */
/** `preload` the first row of a grid: those photos are the largest paint above the fold. */
export function ProductCard({ product, preload }: { product: Product; preload?: boolean }) {
  const soldOut = product.stock === 0;
  const off = discountPercent(product.price, product.compareAtPrice);
  return (
    <Link href={`/products/${product.slug}`} className="group block" data-testid="product-card">
      <div className="relative aspect-square overflow-hidden bg-soft">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1440px) 300px, (min-width: 1024px) 22vw, (min-width: 768px) 33vw, 50vw"
            preload={preload}
            className="object-contain transition-opacity duration-300 group-hover:opacity-0"
          />
        )}
        {product.images[1] && (
          <Image
            src={product.images[1]}
            alt=""
            fill
            sizes="(min-width: 1440px) 300px, (min-width: 1024px) 22vw, (min-width: 768px) 33vw, 50vw"
            className="object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </div>
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
