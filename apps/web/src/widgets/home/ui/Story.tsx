import Image from 'next/image';
import Link from 'next/link';
import factory from '../../../../public/media/factory.jpg';
import weekender from '../../../../public/media/men-weekender-oldenglish.jpg';

export function Why() {
  return (
    <section className="mx-auto grid max-w-[1490px] items-start gap-10 px-4 pb-[60px] pt-[60px] sm:px-10 lg:grid-cols-[minmax(0,522fr)_minmax(0,385fr)_minmax(0,385fr)] lg:gap-x-[34px] lg:gap-y-0">
      <div className="self-center lg:pr-[60px]">
        <h2 className="heading mb-6 text-[28px] sm:text-[30px] sm:leading-[42px]">Why ‘Welt &amp; Grain’?</h2>
        <p className="mb-4 text-[14px] leading-7 text-body">
          The welt is the stitch that lets a boot be resoled for life; full grain is the strongest layer of the hide.
          Together they are our promise: everything we make is built to last for decades. Your life isn’t
          one-dimensional. What you wear shouldn’t be either.
        </p>
        <Link href="/about" className="text-[14px] text-ink underline underline-offset-4 hover:no-underline">Our Story</Link>
      </div>
      <div className="relative aspect-[385/452] overflow-hidden">
        <Image src={factory} alt="A boot sole being pressed in the workshop" fill placeholder="blur" sizes="(min-width: 1490px) 400px, (min-width: 1024px) 27vw, 100vw" className="object-cover" />
      </div>
      <div className="relative aspect-[385/452] overflow-hidden lg:mt-10">
        <Image src={weekender} alt="A leather weekender bag" fill placeholder="blur" sizes="(min-width: 1490px) 400px, (min-width: 1024px) 27vw, 100vw" className="object-cover" />
      </div>
    </section>
  );
}

/** Press logos set in type (no third-party logo files). */
export function PressBar() {
  return (
    <div className="bg-soft">
      <div className="no-scrollbar mx-auto flex max-w-[1490px] items-center gap-x-12 overflow-x-auto px-6 py-8 leading-none text-[#222] sm:justify-between sm:px-10 lg:h-[110px] lg:py-0">
        <span className="shrink-0 text-[14px] text-body">As Featured In:</span>
        <span className="shrink-0 font-sans text-[32px] font-extrabold italic tracking-[-0.04em]">GQ</span>
        <span className="shrink-0 font-serif text-[32px] font-medium tracking-[0.04em]">VOGUE</span>
        <span className="shrink-0 font-sans text-[28px] font-extrabold uppercase tracking-[-0.03em] [transform:scaleY(1.15)]">Esquire</span>
        <span className="hidden shrink-0 font-sans text-[30px] font-bold tracking-[-0.02em] sm:block">InStyle</span>
        <span className="shrink-0 font-serif text-[32px] font-bold">WSJ</span>
        <span className="shrink-0 font-serif text-[34px] font-bold">Forbes</span>
      </div>
    </div>
  );
}

export function CtaBand() {
  return (
    <section className="bg-brand px-6 pb-[42px] pt-[52px] text-center text-white lg:h-[253px]">
      <h2 className="font-serif text-[28px] font-bold text-white sm:text-[32px]">Explore the Collection</h2>
      <p className="mb-[34px] mt-4 text-[16px]">Thoughtfully crafted for wherever the day takes you.</p>
      <div className="flex justify-center gap-[14px]">
        <Link href="/collections/mens-boots" className="btn btn-light h-[46px] w-[150px] px-4 text-[15px] !text-brand sm:w-[175px] sm:text-[16px]">
          Shop Men
        </Link>
        <Link href="/collections/womens-boots" className="btn btn-light h-[46px] w-[150px] px-4 text-[15px] !text-brand sm:w-[175px] sm:text-[16px]">
          Shop Women
        </Link>
      </div>
    </section>
  );
}
