import type { ProductCategory, ProductGender } from './catalog';

/**
 * Landing pages for /collections/mens and /collections/womens: a row of square
 * collection tiles, then sections that pair a large promo image with a few
 * products and a "Shop all" link, like the reference store.
 */

export interface LandingTile {
  title: string;
  href: string;
  image: string;
}

export interface LandingSection {
  /** Small grey heading above the section. */
  eyebrow: string;
  promo: { title: string; text: string; image: string; href: string };
  query: { category?: ProductCategory; gender?: ProductGender; q?: string; featured?: boolean };
  shopAll: { label: string; href: string };
}

export interface Landing {
  gender: ProductGender;
  tilesTitle: string;
  tiles: LandingTile[];
  sections: LandingSection[];
}

export const LANDINGS: Record<string, Landing> = {
  mens: {
    gender: 'men',
    tilesTitle: 'Welt & Grain Everyday',
    tiles: [
      { title: 'The Boot Collection', href: '/collections/mens-boots', image: '/media/men-captain-blackcoffee.jpg' },
      { title: 'The Shoe Collection', href: '/collections/mens-shoes', image: '/media/men-lincoln-richmahogany.jpg' },
      { title: 'The Bag Collection', href: '/collections/mens-bags', image: '/media/men-weekender-oldenglish.jpg' },
      { title: 'The Care Collection', href: '/collections/leather-care', image: '/media/factory.jpg' },
    ],
    sections: [
      {
        eyebrow: 'Featured Boots',
        promo: { title: 'Rugged & Resilient', text: 'Thoughtfully handcrafted to go the extra mile', image: '/media/men-captain-arizona.jpg', href: '/collections/mens-boots' },
        query: { category: 'boots', gender: 'men' },
        shopAll: { label: 'Shop all styles', href: '/collections/mens-boots' },
      },
      {
        eyebrow: 'Lace-Up Boots',
        promo: { title: 'Handcrafted With Integrity', text: 'Timeless leather boots that are built to look good and last', image: '/media/men-captain-blackcoffee.jpg', href: '/collections/mens-boots?q=Captain' },
        query: { category: 'boots', gender: 'men', q: 'Captain' },
        shopAll: { label: 'Shop all Captains', href: '/collections/mens-boots?q=Captain' },
      },
      {
        eyebrow: 'Shoes',
        promo: { title: 'Dress To Impress', text: 'Versatile dress shoes for wherever the day takes you', image: '/media/men-lincoln-richmahogany.jpg', href: '/collections/mens-shoes' },
        query: { category: 'shoes', gender: 'men' },
        shopAll: { label: 'Shop all shoes', href: '/collections/mens-shoes' },
      },
      {
        eyebrow: 'Bags',
        promo: { title: "Men's Bags", text: 'Handcrafted with the highest quality materials', image: '/media/men-weekender-oldenglish.jpg', href: '/collections/mens-bags' },
        query: { category: 'bags', gender: 'men' },
        shopAll: { label: 'Shop all bags', href: '/collections/mens-bags' },
      },
      {
        eyebrow: 'Belts',
        promo: { title: 'The Finishing Touch', text: 'One strip of full-grain leather, built for decades', image: '/media/men-racerjacket-blackmatte.jpg', href: '/collections/belts' },
        query: { category: 'belts', gender: 'men' },
        shopAll: { label: 'Shop all belts', href: '/collections/belts' },
      },
      {
        eyebrow: 'Leather Care',
        promo: { title: 'Keep It Looking New', text: 'Brushes, balms and kits for every leather', image: '/media/factory.jpg', href: '/collections/leather-care' },
        query: { category: 'care' },
        shopAll: { label: 'Shop all leather care', href: '/collections/leather-care' },
      },
    ],
  },
  womens: {
    gender: 'women',
    tilesTitle: 'Welt & Grain Everyday',
    tiles: [
      { title: 'The Boot Collection', href: '/collections/womens-boots', image: '/media/women-legendplatform-black.jpg' },
      { title: 'The Shoe Collection', href: '/collections/womens-shoes', image: '/media/women-penny-black.jpg' },
      { title: 'The Handbag Collection', href: '/collections/womens-handbags', image: '/media/women-bucketbag-toscanello.jpg' },
      { title: 'The Belt Collection', href: '/collections/belts', image: '/media/women-westernbelt-black.jpg' },
    ],
    sections: [
      {
        eyebrow: 'Statement Styles',
        promo: { title: 'Everyday Favorites', text: 'Boots designed to go wherever the day takes you', image: '/media/women-legendplatform-blackmatte.jpg', href: '/collections/womens-boots' },
        query: { category: 'boots', gender: 'women' },
        shopAll: { label: 'Shop all boots', href: '/collections/womens-boots' },
      },
      {
        eyebrow: 'Chelsea Boots',
        promo: { title: 'The Legend', text: 'A lug-sole Chelsea made to be worn every day', image: '/media/women-legendplatform-black.jpg', href: '/collections/womens-boots?q=Legend' },
        query: { category: 'boots', gender: 'women', q: 'Legend' },
        shopAll: { label: 'Shop all Legends', href: '/collections/womens-boots?q=Legend' },
      },
      {
        eyebrow: 'Shoes',
        promo: { title: 'Slip Into Comfort', text: 'The penny loafer, now in more colors', image: '/media/women-penny-blackgold.jpg', href: '/collections/womens-shoes' },
        query: { category: 'shoes', gender: 'women' },
        shopAll: { label: 'Shop all shoes', href: '/collections/womens-shoes' },
      },
      {
        eyebrow: 'Handbags',
        promo: { title: 'Carry It All', text: 'Totes, bucket bags and crossbodies in full-grain leather', image: '/media/women-bucketbag-toscanello.jpg', href: '/collections/womens-handbags' },
        query: { category: 'bags', gender: 'women' },
        shopAll: { label: 'Shop all handbags', href: '/collections/womens-handbags' },
      },
      {
        eyebrow: 'Belts',
        promo: { title: 'The Finishing Touch', text: 'Classic, circle and western belts', image: '/media/women-westernbelt-black.jpg', href: '/collections/belts' },
        query: { category: 'belts', gender: 'women' },
        shopAll: { label: 'Shop all belts', href: '/collections/belts' },
      },
    ],
  },
};

export function findLanding(slug: string): Landing | undefined {
  return LANDINGS[slug];
}
