import Link from 'next/link';
import { NewsletterForm } from '@/features/newsletter';
import { FOOTER_COLUMNS, SITE } from '@/shared/config';
import { Icon, type IconName } from '@/shared/ui';

const SOCIAL: { icon: IconName; label: string }[] = [
  { icon: 'instagram', label: 'Instagram' },
  { icon: 'facebook', label: 'Facebook' },
  { icon: 'pinterest', label: 'Pinterest' },
  { icon: 'youtube', label: 'YouTube' },
];

/** Link columns on desktop; on phones each column folds into an accordion. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-content grid gap-x-10 py-9 text-[14px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-x-6 lg:py-10 xl:grid-cols-[233px_207px_264px_minmax(0,1fr)] xl:gap-x-0">
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            {/* desktop */}
            <h2 className="mb-1 hidden text-[14px] font-medium text-body lg:block">{col.title}</h2>
            <ul className="hidden lg:block">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="leading-7 text-mute transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* phones */}
            <details className="group border-b border-line lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[14px] text-body">
                {col.title}
                <Icon name="plus" width={16} height={16} className="group-open:hidden" />
                <Icon name="minus" width={16} height={16} className="hidden group-open:block" />
              </summary>
              <ul className="pb-3">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="block py-1 leading-7 text-mute">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}

        <div className="mt-8 lg:mt-0">
          <h2 className="mb-4 text-[14px] font-medium text-body">Sign Up For Early Access &amp; Exclusive Events</h2>
          <NewsletterForm buttonLabel="Join the Workshop" tone="accent" className="max-w-[456px]" />
          <ul className="mt-6 flex gap-6 text-ink">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <span title={`${s.label} (demo)`} className="block">
                  <Icon name={s.icon} width={24} height={24} aria-hidden={false} aria-label={s.label} role="img" />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-7 text-[13px] leading-6 text-mute">
            © 2026 {SITE.legalName} A demo shop — no real orders or payments.
          </p>
        </div>
      </div>
    </footer>
  );
}
