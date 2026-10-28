import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Frank_Ruhl_Libre, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/widgets/header';
import { SiteFooter } from '@/widgets/footer';
import { SITE } from '@/shared/config';
import { Icon } from '@/shared/ui';
import { CartButton, CartDrawer, CartProvider } from '@/features/cart';

const serif = Frank_Ruhl_Libre({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-frank-ruhl', display: 'swap' });
const sans = Nunito_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-nunito', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Leather Boots, Shoes & Bags`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ['leather boots', 'leather shoes', 'leather bags', 'Goodyear welt', 'full-grain leather'],
  alternates: { canonical: '/' },
  openGraph: { siteName: SITE.name, type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#243a3e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-svh flex-col">
        <CartProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:bg-white focus:p-2">
          Skip to content
        </a>
        <SiteHeader
          account={
            <Link href="/account" aria-label="Account" className="flex items-center">
              <Icon name="user" width={22} height={22} />
            </Link>
          }
          cart={<CartButton />}
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
        <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
