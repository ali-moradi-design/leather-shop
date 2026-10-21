import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/widgets/header';
import { Suspense } from 'react';
import { CartBadge } from '@/features/cart-badge';
import { UserGreeting } from '@/features/user-greeting';

export const metadata: Metadata = {
  title: 'Niko Bookshop — PPR',
  description: 'Niko Bookshop demo (PPR) against layered Bookshop API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader modeLabel="PPR" trailing={(
              <Suspense fallback={<span className="text-xs text-slate-400">…</span>}>
                <div className="flex items-center gap-3">
                  <UserGreeting />
                  <CartBadge />
                </div>
              </Suspense>
            )} />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-slate-400">
          Layered API catalog · FSD · Next App Router · PPR
        </footer>
      </body>
    </html>
  );
}
