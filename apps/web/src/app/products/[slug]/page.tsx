import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import {
  fetchColors,
  fetchLiveVariants,
  fetchProduct,
  fetchProducts,
  type Product,
} from '@/entities/product';
import { BuyBox, BuyBoxSkeleton } from '@/features/add-to-cart';
import { FavoriteButton } from '@/features/favorite';
import { ReviewForm, ReviewList } from '@/features/reviews';
import { ColorPicker, Details, Editorial, Gallery } from '@/widgets/product-detail';
import { COLLECTIONS, SITE } from '@/shared/config';
import { formatMoney } from '@/shared/lib/money';
import { Icon, Skeleton, Stars } from '@/shared/ui';

type Props = { params: Promise<{ slug: string }> };

/** Featured products are prerendered at build time; the rest on first visit. */
export async function generateStaticParams() {
  const { data } = await fetchProducts({ featured: true, limit: 24 });
  return data.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.title,
    description: `${product.title} — ${product.features.slice(0, 2).join(', ')}. ${formatMoney(product.price)}, free shipping and returns.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { images: product.images.slice(0, 1), type: 'website' },
  };
}

function collectionOf(p: Product) {
  return (
    COLLECTIONS.find((c) => c.category === p.category && c.gender === p.gender) ??
    COLLECTIONS.find((c) => c.category === p.category)
  );
}

/** Live stock per size: a dynamic hole in the prerendered product page. */
async function LiveBuyBox({ product }: { product: Product }) {
  const variants = await fetchLiveVariants(product.slug);
  const sizeNote = product.category === 'boots' ? 'Order ½ size smaller than you wear in sneakers.' : undefined;
  return <BuyBox productId={product.id} price={product.price} variants={variants} sizeNote={sizeNote} />;
}

function JsonLd({ product }: { product: Product }) {
  const collection = collectionOf(product);
  const url = `${SITE.url}/products/${product.slug}`;
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      image: product.images,
      description: product.description,
      sku: product.variants[0]?.sku,
      color: product.color,
      material: product.leather,
      brand: { '@type': 'Brand', name: SITE.name },
      ...(product.ratingCount > 0 && {
        aggregateRating: { '@type': 'AggregateRating', ratingValue: product.ratingAvg, reviewCount: product.ratingCount },
      }),
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: product.currency,
        price: (product.price / 100).toFixed(2),
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
        ...(collection
          ? [{ '@type': 'ListItem', position: 2, name: collection.title, item: `${SITE.url}/collections/${collection.slug}` }]
          : []),
        { '@type': 'ListItem', position: collection ? 3 : 2, name: product.title, item: url },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inline; the content is our own catalog data, escaped for </script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export default async function ProductPage({ params }: Props) {
  const product = await fetchProduct((await params).slug);
  if (!product) notFound();
  const colors = await fetchColors(product.slug);
  const collection = collectionOf(product);

  return (
    <>
      <JsonLd product={product} />
      <div className="container-shop">
        <section className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,730px)_minmax(0,1fr)] lg:gap-[50px] lg:pt-[18px]">
          <div>
            <nav aria-label="Breadcrumb" className="pb-4 text-[13px] text-mute lg:pb-6">
              <Link href="/" className="underline underline-offset-2 hover:text-ink">Home</Link>
              {collection && (
                <>
                  <span className="mx-1">›</span>
                  <Link href={`/collections/${collection.slug}`} className="underline underline-offset-2 hover:text-ink">{collection.title}</Link>
                </>
              )}
              <span className="mx-1">›</span>
              <span aria-current="page">{product.name}</span>
            </nav>
            <Gallery images={product.images} title={product.title} />
          </div>
          <div className="lg:sticky lg:top-[calc(var(--header-h)+18px)] lg:self-start lg:pt-1">
            <div className="flex items-start justify-between gap-4">
              <h1 className="heading text-[28px] leading-[1.25] sm:text-[30px]">{product.name}</h1>
              <FavoriteButton productId={product.id} />
            </div>
            <p className="mb-3 mt-2 text-[16px] text-body">
              {product.compareAtPrice && <s className="mr-2 text-mute">{formatMoney(product.compareAtPrice)}</s>}
              <span className="text-ink">{formatMoney(product.price)}</span> or 4 payments of {formatMoney(Math.round(product.price / 4))}
            </p>
            <p className="flex items-center gap-2 text-[14.5px] text-accent">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-accent text-white">
                <Icon name="check" width={10} height={10} strokeWidth={3} />
              </span>
              Honest Pricing Guarantee
              <Link href="/about" className="text-mute underline underline-offset-2">More info</Link>
            </p>
            {product.ratingCount > 0 && (
              <a href="#reviews" className="mt-2.5 flex items-center gap-2 text-[14px] text-accent">
                <Stars value={product.ratingAvg} />
                <span className="underline underline-offset-2">{product.ratingAvg.toFixed(1)} ({product.ratingCount} reviews)</span>
              </a>
            )}
            <ColorPicker current={product} colors={colors} />
            <Suspense fallback={<BuyBoxSkeleton />}>
              <LiveBuyBox product={product} />
            </Suspense>
          </div>
        </section>
      </div>
      <Details product={product} />
      <Editorial product={product} />
      <section id="reviews" className="container-shop scroll-mt-28 py-16">
        <h2 className="heading mb-6 text-[28px]">Reviews</h2>
        <Suspense fallback={<ReviewsSkeleton />}>
          <ReviewList slug={product.slug} />
        </Suspense>
        <h3 className="heading mb-4 mt-12 text-[22px]">Write a review</h3>
        <ReviewForm productId={product.id} />
      </section>
    </>
  );
}

function ReviewsSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-2 border-b border-line pb-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
