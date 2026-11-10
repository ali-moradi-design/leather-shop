import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Why we build leather goods with full-grain hides and Goodyear welts, and sell them at honest prices.',
};

const NUMBERS = [
  ['200+', 'steps to make one pair of boots'],
  ['4', 'resoles a welted boot can take'],
  ['30', 'days to return or swap a size'],
  ['1', 'price: no seasonal mark-ups'],
] as const;

const STEPS = [
  {
    title: 'Choose the hide',
    text: 'We buy full-grain leather from tanneries we visit, and check each hide by hand. Scars and thin spots are cut around, never hidden with paint.',
    image: '/media/men-captain-arizona.jpg',
    alt: 'Tan full-grain leather boot',
  },
  {
    title: 'Cut and stitch',
    text: 'Pieces are cut so the strongest part of the hide sits where a boot bends most. Uppers are stitched with waxed thread that will not rot.',
    image: '/media/women-penny-black.jpg',
    alt: 'Black leather loafer',
  },
  {
    title: 'Last and welt',
    text: 'The upper is pulled over a wooden last and rests there for days to take its shape. Then a leather welt is stitched between the upper and the sole.',
    image: '/media/factory.jpg',
    alt: 'A sole being pressed in the workshop',
  },
  {
    title: 'Finish by hand',
    text: 'Edges are trimmed, burnished and waxed; the leather is conditioned and buffed. Every pair is checked before it is boxed.',
    image: '/media/men-lincoln-richmahogany.jpg',
    alt: 'Mahogany leather boot',
  },
];

const VALUES = [
  ['Built to be repaired', 'A welted sole can be replaced again and again by any good cobbler, so the boot outlasts its soles several times over.'],
  ['Honest prices', 'We sell only here, so there is no wholesale mark-up. What you pay goes into the leather and the work, not into a store lease.'],
  ['Small batches', 'We make in small runs and restock popular sizes. If your size is gone, ask to be emailed: it usually comes back within weeks.'],
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="relative flex min-h-[420px] items-end text-white sm:min-h-[520px]">
        <Image src="/media/factory.jpg" alt="" fill preload sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="container-content relative pb-14">
          <p className="eyebrow text-white/80">Our story</p>
          <h1 className="heading mt-3 max-w-2xl text-[40px] leading-tight text-white sm:text-[56px]">Made like they used to, priced like they should be</h1>
        </div>
      </section>

      <section className="container-content grid gap-10 py-16 lg:grid-cols-[1fr_1.2fr] lg:gap-20 lg:py-24">
        <h2 className="heading text-[30px] leading-snug sm:text-[36px]">The boots our grandparents wore were built to be repaired, not replaced.</h2>
        <div className="space-y-5 text-[17px] leading-8 text-body">
          <p>
            Welt &amp; Grain started with that idea. Somewhere along the way, most footwear became something you wear out and throw away:
            glued soles, coated leather, a new pair every year.
          </p>
          <p>
            We went back to the slower way of doing it. Full-grain leather that ages instead of cracking. Soles stitched on, so they can be
            stitched off again. And we sell directly, so a boot built to last ten years does not cost a month’s rent.
          </p>
        </div>
      </section>

      <section aria-label="In numbers" className="border-y border-line bg-soft">
        <dl className="container-content grid grid-cols-2 gap-y-10 py-14 lg:grid-cols-4">
          {NUMBERS.map(([n, label]) => (
            <div key={label} className="px-2 text-center">
              <dt className="sr-only">{label}</dt>
              <dd className="heading text-[44px] text-brand">{n}</dd>
              <dd className="mt-1 text-[14px] text-mute">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="container-content py-16 lg:py-24" aria-labelledby="how-heading">
        <p className="eyebrow text-mute">From hide to box</p>
        <h2 id="how-heading" className="heading mt-2 text-[34px]">How a pair is made</h2>
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <div className="relative aspect-[4/5] overflow-hidden bg-soft">
                <Image src={s.image} alt={s.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
              <p className="mt-5 font-serif text-[15px] text-mute">0{i + 1}</p>
              <h3 className="heading mt-1 text-[22px]">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-body">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-brand text-white">
        <div className="container-content grid gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div id="leather" className="scroll-mt-40">
            <p className="eyebrow text-white/70">Material</p>
            <h2 className="heading mt-2 text-[32px] text-white">Full-grain leather</h2>
            <p className="mt-4 text-[16px] leading-8 text-white/85">
              Full grain is the top layer of the hide, with the natural grain left intact. It is the strongest and most breathable leather
              there is. It is not sanded or coated, so it shows small marks of the animal’s life, and over the years it darkens and softens
              into a patina that is yours alone.
            </p>
          </div>
          <div id="craft" className="scroll-mt-40">
            <p className="eyebrow text-white/70">Construction</p>
            <h2 className="heading mt-2 text-[32px] text-white">The Goodyear welt</h2>
            <p className="mt-4 text-[16px] leading-8 text-white/85">
              A welt is a strip of leather stitched between the upper and the sole. It keeps water out, gives the boot a stable base, and
              lets a cobbler replace the sole without touching the upper. Glued shoes cannot be resoled; a welted pair can be, again and
              again, for decades.
            </p>
          </div>
        </div>
      </section>

      <section className="container-content py-16 lg:py-24" aria-labelledby="values-heading">
        <h2 id="values-heading" className="heading text-[34px]">What we hold to</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {VALUES.map(([title, text]) => (
            <div key={title} className="border-t-2 border-ink pt-5">
              <h3 className="heading text-[22px]">{title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-body">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-content grid items-center gap-10 pb-16 lg:grid-cols-2 lg:pb-24">
        <div className="relative aspect-[4/3] overflow-hidden bg-soft">
          <Image src="/media/dualgender.jpg" alt="A pair of men’s and women’s leather boots" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>
          <h2 className="heading text-[32px]">Wear them in, then wear them for years</h2>
          <p className="mt-4 text-[16px] leading-8 text-body">
            Good leather asks for a little care: brush it after wear, condition it every few months, and let it dry away from heat. Our
            <Link href="/help#care" className="link-underline mx-1">care guide</Link>
            covers the rest, and our
            <Link href="/help#sizing" className="link-underline mx-1">fit notes</Link>
            help you choose the right size the first time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/collections/mens-boots" className="btn">Shop men’s</Link>
            <Link href="/collections/womens-boots" className="btn btn-outline">Shop women’s</Link>
          </div>
        </div>
      </section>

      <aside className="container-content pb-16">
        <p className="border border-line bg-soft p-5 text-[14px] leading-7 text-mute">
          This is a portfolio demo shop. Product names, photos and prices come from a public online store catalog and are used only as
          sample content; nothing here is for sale.
        </p>
      </aside>
    </>
  );
}
