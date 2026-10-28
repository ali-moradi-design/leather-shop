import type { ProductCategory, ProductGender } from './catalog';

export const SITE = {
  name: 'Welt & Grain',
  legalName: 'Welt & Grain Leather Co.',
  description:
    'Full-grain leather boots, shoes, bags and small goods. Goodyear-welted, resoleable, honestly priced.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};

export interface Collection {
  slug: string;
  title: string;
  tagline: string;
  category?: ProductCategory;
  gender?: ProductGender;
  hero: string;
  /** Style chips shown in the filter bar (query `q`). */
  chips?: string[];
}

/** Collection pages: /collections/<slug>. */
export const COLLECTIONS: Collection[] = [
  // landing pages (/collections/mens, /collections/womens): see landings.ts
  { slug: 'mens', title: "Men's Collection", tagline: 'Full-Grain Leather. Honest Prices.', gender: 'men', hero: '/media/dualgender.jpg' },
  { slug: 'womens', title: "Women's Collection", tagline: 'Made for every step.', gender: 'women', hero: '/media/women-legendplatform-blackmatte.jpg' },
  { slug: 'mens-boots', title: "Men's Boots", tagline: 'Full-Grain Leather. Honest Prices.', category: 'boots', gender: 'men', hero: '/media/dualgender.jpg', chips: ['Captain', 'President', 'Cavalier', 'Logger', 'StormKing', 'Suede'] },
  { slug: 'womens-boots', title: "Women's Boots", tagline: 'Made for every step.', category: 'boots', gender: 'women', hero: '/media/women-legendplatform-blackmatte.jpg', chips: ['Legend', 'Captain', 'Duchess', 'Arden', 'Knee-high', 'Suede'] },
  { slug: 'mens-shoes', title: "Men's Shoes", tagline: 'Loafers, oxfords and more.', category: 'shoes', gender: 'men', hero: '/media/men-lincoln-richmahogany.jpg' },
  { slug: 'womens-shoes', title: "Women's Shoes", tagline: 'Loafers, flats and heels.', category: 'shoes', gender: 'women', hero: '/media/women-penny-blackgold.jpg' },
  { slug: 'mens-bags', title: "Men's Bags", tagline: 'Built to carry for decades.', category: 'bags', gender: 'men', hero: '/media/men-weekender-oldenglish.jpg', chips: ['Weekender', 'Commuter', 'Backpack', 'Dopp Kit'] },
  { slug: 'womens-handbags', title: "Women's Handbags", tagline: 'Everyday leather, made to last.', category: 'bags', gender: 'women', hero: '/media/women-bucketbag-toscanello.jpg', chips: ['Tote', 'Bucket', 'Crossbody', 'Crescent'] },
  { slug: 'bags', title: 'Bags', tagline: 'Built to carry for decades.', category: 'bags', hero: '/media/men-weekender-oldenglish.jpg' },
  { slug: 'belts', title: 'Belts', tagline: 'One strip of full-grain leather.', category: 'belts', hero: '/media/women-westernbelt-black.jpg' },
  { slug: 'wallets', title: 'Wallets', tagline: 'Small goods, built to last.', category: 'wallets', hero: '/media/men-captain-arizona.jpg' },
  { slug: 'accessories', title: 'Accessories', tagline: 'The finishing touches.', category: 'accessories', hero: '/media/men-captain-arizona.jpg' },
  { slug: 'leather-care', title: 'Leather Care', tagline: 'Keep your leather looking its best.', category: 'care', hero: '/media/factory.jpg' },
];

export function findCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

