import Image from 'next/image';
import Link from 'next/link';

export interface SplitTile {
  image: string;
  alt: string;
  title: string;
  href: string;
  links?: { href: string; label: string }[];
}

/** Two large lifestyle tiles side by side, title bottom-left. */
export function Split({ tiles, className }: { tiles: [SplitTile, SplitTile]; className?: string }) {
  return (
    <section className={`grid gap-1.5 sm:grid-cols-2 sm:gap-0 ${className ?? ''}`}>
      {tiles.map((t) => (
        <div key={t.title} className="group relative h-[440px] overflow-hidden text-white sm:h-[520px] lg:h-[655px]">
          <Link href={t.href} aria-label={t.title} className="absolute inset-0">
            <Image src={t.image} alt={t.alt} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent to-45%" />
          </Link>
          <div className="pointer-events-none absolute bottom-[30px] left-[25px]">
            <h2 className="font-serif text-[30px] font-bold leading-[42px] text-white">{t.title}</h2>
            {t.links && (
              <div className="pointer-events-auto mt-2 flex gap-7 text-[12px] font-semibold uppercase tracking-[1.68px]">
                {t.links.map((l) => (
                  <Link key={l.href} href={l.href} className="underline underline-offset-[5px] hover:no-underline">{l.label}</Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
