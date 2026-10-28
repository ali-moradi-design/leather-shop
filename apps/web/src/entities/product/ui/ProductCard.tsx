import Image from 'next/image';
import Link from 'next/link';
import { formatMoney } from '@/shared/lib/money';
import type { Product } from '../model/types';

/** Grid tile: light grey square image, name + price, color below (like the mockup). */
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const soldOut = product.stock === 0;
  return (
    <Link href={`/products/${product.slug}`} className="group block" data-testid="product-card">
      <div className="relative aspect-square overflow-hidden bg-soft">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1440px) 300px, (min-width: 1024px) 22vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
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
      {(soldOut || product.tags.includes('new-arrival')) && (
        <span className="mt-2 inline-block bg-mute px-2 py-[3px] text-[13px] leading-[18px] text-white">
          {soldOut ? 'Sold Out' : 'New Arrival'}
        </span>
      )}
    </Link>
  );
}
