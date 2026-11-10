import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQ } from './faq';
import { FaqList } from './FaqList';

export const metadata: Metadata = {
  title: 'Help & FAQ',
  description: 'Orders, shipping, returns, sizing and leather care at Welt & Grain.',
};

const SHORTCUTS = [
  ['Track an order', '/account', 'Order page has the tracking link'],
  ['Return or swap a size', '/help#how-to-return', 'Free within 30 days'],
  ['Find my size', '/help#sizing', 'Most boots: ½ size down'],
  ['Care for leather', '/help#care', 'Brush, condition, repeat'],
] as const;

export default function HelpPage() {
  return (
    <div className="container-content py-14 lg:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow text-mute">Help</p>
        <h1 className="heading mt-2 text-[40px] sm:text-[48px]">How can we help?</h1>
        <p className="mt-3 text-[17px] leading-8 text-body">Answers about orders, shipping, returns, fit and caring for your leather.</p>
      </header>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SHORTCUTS.map(([title, href, note]) => (
          <li key={title}>
            <Link href={href} className="block h-full border border-line p-5 transition-colors hover:border-ink">
              <span className="block text-[16px] font-medium text-ink">{title} →</span>
              <span className="mt-1 block text-[13px] text-mute">{note}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Topics" className="hidden lg:block">
          <ul className="sticky top-[calc(var(--header-h)+24px)] mt-10 space-y-2 text-[14px]">
            {FAQ.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-mute hover:text-ink">{s.title}</a>
              </li>
            ))}
            <li><a href="#contact" className="text-mute hover:text-ink">Contact us</a></li>
          </ul>
        </nav>
        <div className="max-w-3xl">
          <FaqList sections={FAQ} />

          <section id="contact" aria-labelledby="contact-h" className="mt-14 scroll-mt-40 bg-brand p-8 text-white">
            <h2 id="contact-h" className="heading text-[26px] text-white">Still have a question?</h2>
            <p className="mt-2 text-[15px] leading-7 text-white/85">We answer every email within one business day, usually much sooner.</p>
            <dl className="mt-6 grid gap-6 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-[12px] uppercase tracking-[0.16em] text-white/60">Email</dt>
                <dd className="mt-1">help@weltandgrain.example</dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.16em] text-white/60">Hours</dt>
                <dd className="mt-1">Mon–Fri, 9am–5pm Pacific</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
