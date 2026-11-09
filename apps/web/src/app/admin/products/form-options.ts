import { fetchFacets } from '@/entities/product';
import type { ProductFormOptions } from '@/features/admin';

/** Suggestions for the product form, from the cached catalog facets. */
export async function productFormOptions(): Promise<ProductFormOptions> {
  const facets = await fetchFacets({});
  return {
    colorFamilies: facets.colors.map((c) => c.value),
    leathers: facets.leathers.map((l) => l.value),
    styles: facets.styles.map((s) => s.value),
  };
}
