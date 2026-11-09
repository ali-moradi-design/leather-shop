import { fetchProducts, ProductCard, type Product } from '@/entities/product';
import { DragScroll } from '@/shared/ui';

/**
 * Other styles from the same collection, one color each. Reads the cached
 * catalog, so it is part of the prerendered page.
 */
export async function RelatedProducts({ product }: { product: Product }) {
  const { data } = await fetchProducts({ category: product.category, gender: product.gender, inStock: true, limit: 30 });
  const seen = new Set([product.style]);
  const picks = data.filter((p) => !seen.has(p.style) && seen.add(p.style)).slice(0, 8);
  if (picks.length === 0) return null;
  return (
    <section className="pb-16 pt-4" aria-labelledby="related-products">
      <h2 id="related-products" className="heading container-shop mb-5 text-[24px] sm:text-[28px]">You may also like</h2>
      <DragScroll className="gap-3 px-4 pb-2 sm:px-6 lg:px-[58px] [&>*]:w-[62vw] [&>*]:shrink-0 sm:[&>*]:w-[260px]">
        {picks.map((p) => <ProductCard key={p.id} product={p} />)}
      </DragScroll>
    </section>
  );
}
