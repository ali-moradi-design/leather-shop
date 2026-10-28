import Link from 'next/link';
import { SUB_NAV } from '@/shared/config';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow text-mute">404</p>
      <h1 className="heading mt-3 text-[32px]">Page not found</h1>
      <p className="mt-3 text-mute">The page you are looking for is gone or never existed.</p>
      <Link href="/" className="btn mt-8">Back to the shop</Link>
      <ul className="mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-3 text-[14px] text-ink">
        {SUB_NAV.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="underline underline-offset-4 hover:no-underline">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
