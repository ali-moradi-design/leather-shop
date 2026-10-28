/** Header, mega menu and footer navigation. All links point at real collections. */

export interface NavLink {
  label: string;
  href: string;
}

export interface MegaColumn {
  title: NavLink;
  links: NavLink[];
}

export interface MegaMenu {
  label: string;
  href: string;
  /** Columns of the full-width panel; a column can stack two groups. */
  columns: MegaColumn[][];
  feature: { image: string; alt: string; title: string; text: string; href: string };
}

const style = (slug: string, q: string): NavLink => ({ label: q, href: `/collections/${slug}?q=${encodeURIComponent(q)}` });
const all = (slug: string, label = 'All Styles'): NavLink => ({ label, href: `/collections/${slug}` });

export const MEGA_MENU: MegaMenu[] = [
  {
    label: 'Men',
    href: '/collections/mens',
    columns: [
      [
        {
          title: { label: 'Boots', href: '/collections/mens-boots' },
          links: [
            all('mens-boots'),
            style('mens-boots', 'Captain'),
            style('mens-boots', 'President'),
            style('mens-boots', 'Cavalier'),
            style('mens-boots', 'Logger'),
            style('mens-boots', 'Scout'),
            style('mens-boots', 'Wingtip'),
            style('mens-boots', 'StormKing'),
            style('mens-boots', 'Suede'),
          ],
        },
      ],
      [
        {
          title: { label: 'Shoes', href: '/collections/mens-shoes' },
          links: [all('mens-shoes'), style('mens-shoes', 'Loafer'), style('mens-shoes', 'Lincoln'), style('mens-shoes', 'Runner')],
        },
        {
          title: { label: 'Bags', href: '/collections/mens-bags' },
          links: [all('mens-bags'), style('mens-bags', 'Weekender'), style('mens-bags', 'Commuter'), style('mens-bags', 'Backpack')],
        },
      ],
      [
        {
          title: { label: 'Accessories', href: '/collections/accessories' },
          links: [all('belts', 'Belts'), all('wallets', 'Wallets'), all('accessories', 'All Accessories')],
        },
        {
          title: { label: 'Leather Care', href: '/collections/leather-care' },
          links: [all('leather-care', 'Care Kits'), style('leather-care', 'Brush'), style('leather-care', 'Tree')],
        },
      ],
    ],
    feature: {
      image: '/media/men-captain-arizona.jpg',
      alt: 'Brown lace-up boots on a rocky trail',
      title: 'Rugged & Resilient',
      text: 'Thoughtfully handcrafted to go the extra mile',
      href: '/collections/mens-boots',
    },
  },
  {
    label: 'Women',
    href: '/collections/womens',
    columns: [
      [
        {
          title: { label: 'Boots', href: '/collections/womens-boots' },
          links: [
            all('womens-boots'),
            style('womens-boots', 'Legend'),
            style('womens-boots', 'Duchess'),
            style('womens-boots', 'Arden'),
            style('womens-boots', 'Bootie'),
            style('womens-boots', 'Platform'),
            style('womens-boots', 'Knee'),
            style('womens-boots', 'Suede'),
          ],
        },
      ],
      [
        {
          title: { label: 'Shoes', href: '/collections/womens-shoes' },
          links: [all('womens-shoes'), style('womens-shoes', 'Penny'), style('womens-shoes', 'Mule'), style('womens-shoes', 'Mary Jane')],
        },
        {
          title: { label: 'Handbags', href: '/collections/womens-handbags' },
          links: [all('womens-handbags', 'All Handbags'), style('womens-handbags', 'Tote'), style('womens-handbags', 'Crossbody')],
        },
      ],
      [
        {
          title: { label: 'Accessories', href: '/collections/accessories' },
          links: [all('belts', 'Belts'), all('accessories', 'Charms'), all('leather-care', 'Leather Care')],
        },
      ],
    ],
    feature: {
      image: '/media/women-legendplatform-blackmatte.jpg',
      alt: 'Black Chelsea boots on a city street',
      title: 'Everyday Favorites',
      text: 'Boots designed to go wherever the day takes you',
      href: '/collections/womens-boots',
    },
  },
];

/** The thin category bar under the header on desktop. */
export const SUB_NAV: NavLink[] = [
  { label: "Men's", href: '/collections/mens' },
  { label: "Women's", href: '/collections/womens' },
  { label: "Men's Boots", href: '/collections/mens-boots' },
  { label: "Women's Boots", href: '/collections/womens-boots' },
  { label: "Men's Shoes", href: '/collections/mens-shoes' },
  { label: "Women's Shoes", href: '/collections/womens-shoes' },
  { label: "Men's Bags", href: '/collections/mens-bags' },
  { label: "Women's Handbags", href: '/collections/womens-handbags' },
  { label: 'Belts', href: '/collections/belts' },
  { label: 'Wallets', href: '/collections/wallets' },
  { label: 'Leather Care', href: '/collections/leather-care' },
];

const CDN = 'https://cdn.shopify.com/s/files/1/0419/1525';

/** Round product thumbnails that replace the category bar on phones. */
export const CATEGORY_CIRCLES: (NavLink & { image: string })[] = [
  { label: "Men's Boots", href: '/collections/mens-boots', image: `${CDN}/products/3.4_Scout_Tobacco_e5c46f94-672c-4743-8c53-1f3906a66d8f.jpg` },
  { label: "Women's Boots", href: '/collections/womens-boots', image: `${CDN}/products/1024x1024-Womens-Duchess-Walnut-090922-Side.jpg` },
  { label: "Men's Shoes", href: '/collections/mens-shoes', image: `${CDN}/files/01-1024x1024-Men-Lincoln-DarkBrown-061726-3.4.jpg` },
  { label: "Women's Shoes", href: '/collections/womens-shoes', image: `${CDN}/files/01-1024x1024-Womens-PennyPlatform-Black-020924-3.4.jpg` },
  { label: "Men's Bags", href: '/collections/mens-bags', image: `${CDN}/files/1024x1024-WeekenderBag-VintageTobaccoCanvas-110323-3.4.jpg` },
  { label: "Women's Bags", href: '/collections/womens-handbags', image: `${CDN}/files/1024x1024-Women-BucketBag-Tan-110525-FrontClosed_8c249145-763d-4786-9cc7-52164391077d.jpg` },
  { label: 'Belts', href: '/collections/belts', image: `${CDN}/files/1024x1024-Men-Heritage-Tobacco-072723-Rolled.jpg` },
  { label: 'Wallets', href: '/collections/wallets', image: `${CDN}/files/1024x1024-Men-BifoldWallet-RusticBrown-102825-Closed.jpg` },
  { label: 'Leather Care', href: '/collections/leather-care', image: `${CDN}/products/1024x1024-EssentialLeatherKit-1.jpg` },
];

/** Plain text links (desktop header right side, mobile menu). */
export const SECONDARY_NAV: NavLink[] = [
  { label: 'About', href: '/about' },
  { label: 'Help', href: '/help' },
  { label: 'Shipping & Returns', href: '/help#shipping' },
  { label: 'Account', href: '/account' },
  { label: 'Favorites', href: '/account/favorites' },
];

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  { title: 'Shop', links: SUB_NAV.concat([{ label: 'Accessories', href: '/collections/accessories' }]) },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '/about' },
      { label: 'Our Leathers', href: '/about#leather' },
      { label: 'Craft', href: '/about#craft' },
      { label: 'Reviews', href: '/#reviews' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', href: '/help' },
      { label: 'Shipping & Returns', href: '/help#shipping' },
      { label: 'Size Guide', href: '/help#sizing' },
      { label: 'My Account', href: '/account' },
      { label: 'Order History', href: '/account' },
    ],
  },
];
