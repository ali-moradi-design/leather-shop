import Image from 'next/image';
import Link from 'next/link';
import heroImage from '../../../../public/media/dualgender.jpg';

/**
 * Full-bleed hero that fills the rest of the first screen on every device:
 * 100svh minus the announcement bar, header and category row above it.
 * Phones: copy on top, centered, buttons pinned to the bottom.
 * Desktop: copy and buttons bottom-left.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative h-[calc(100svh-var(--announce-h)-var(--header-h)-var(--subnav-h))] min-h-[460px] overflow-hidden"
    >
      <Image
        src={heroImage}
        alt="Two people walking down a city street in leather boots"
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="object-cover object-[60%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/25 lg:bg-gradient-to-tr lg:from-black/50 lg:via-black/10 lg:to-transparent" />

      <div className="absolute inset-x-0 top-0 px-6 pt-10 text-center text-white sm:pt-12 lg:inset-x-auto lg:bottom-[142px] lg:left-[73px] lg:top-auto lg:p-0 lg:text-left">
        <p className="text-[13px] font-medium uppercase leading-8 tracking-[2px] sm:text-[16px]">Handcrafted with integrity</p>
        <h1 id="hero-title" className="font-serif text-[38px] font-bold leading-[1.18] text-white sm:text-[52px] lg:text-[56px] lg:leading-[70px]">
          Full-Grain Leather.
          <br />
          Honest Prices.
        </h1>
      </div>

      <div className="absolute inset-x-0 bottom-6 flex gap-1.5 px-6 sm:bottom-10 sm:justify-center lg:inset-x-auto lg:bottom-[74px] lg:left-[75px] lg:px-0">
        <Link href="/collections/mens-boots" className="btn btn-light h-11 flex-1 px-4 sm:w-[260px] sm:flex-none lg:w-[170px]">
          Shop Men
        </Link>
        <Link href="/collections/womens-boots" className="btn btn-light h-11 flex-1 px-4 sm:w-[260px] sm:flex-none lg:w-[170px]">
          Shop Women
        </Link>
      </div>
    </section>
  );
}
