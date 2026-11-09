import type { Product } from '@/entities/product';

/** US → EU / UK conversions for the sizes the shop sells. */
const MEN = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13].map((us) => ({ us, eu: Math.round(us + 33), uk: us - 0.5 }));
const WOMEN = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11].map((us) => ({ us, eu: Math.round(us + 30.5), uk: us - 2 }));
const BELTS = [28, 30, 32, 34, 36, 38, 40, 42].map((waist) => ({ waist, belt: waist + 2 }));

export function hasSizeGuide(p: Pick<Product, 'category'>) {
  return p.category === 'boots' || p.category === 'shoes' || p.category === 'belts';
}

const cell = 'border border-line px-3 py-2 text-center';

/** Size table for the product's category; server-rendered, shown in the accordion and the size dialog. */
export function SizeGuide({ product }: { product: Pick<Product, 'category' | 'gender'> }) {
  if (product.category === 'belts') {
    return (
      <div className="text-[14px]">
        <p className="mb-3">Pick a belt two sizes above your trouser waist. Measured from the buckle fold to the middle hole.</p>
        <table className="w-full border-collapse">
          <thead className="bg-soft"><tr><th className={cell}>Trouser waist (in)</th><th className={cell}>Belt size</th></tr></thead>
          <tbody>{BELTS.map((r) => <tr key={r.waist}><td className={cell}>{r.waist}</td><td className={cell}>{r.belt}</td></tr>)}</tbody>
        </table>
      </div>
    );
  }
  const rows = product.gender === 'women' ? WOMEN : MEN;
  return (
    <div className="text-[14px]">
      <p className="mb-3">
        {product.category === 'boots'
          ? 'Our boots run large: order ½ size smaller than your sneaker size. Leather stretches a little and the footbed molds to you within a few weeks.'
          : 'True to size for most feet. Between sizes? Take the half size up.'}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse">
          <thead className="bg-soft"><tr><th className={cell}>US</th><th className={cell}>EU</th><th className={cell}>UK</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.us}><td className={cell}>{r.us}</td><td className={cell}>{r.eu}</td><td className={cell}>{r.uk}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
