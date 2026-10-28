import { Stars } from '@/shared/ui';

const REVIEWS = [
  { title: 'Leather like butter', body: 'Broke in within a week and they look better every month. Better than pairs costing twice as much.', name: 'Daniel R.' },
  { title: 'Worth every penny!', body: 'The stitching and the leather are flawless — high quality from top to bottom. Comfortable right out of the box.', name: 'Sara K.' },
  { title: 'My go-to boots', body: 'I wear them to work and on weekends. Resoled once already and they feel new again.', name: 'Marcus T.' },
  { title: 'Quietly luxurious', body: 'The bag is beautiful — the leather smells and feels incredible. Customer service was exceptional too.', name: 'Lena M.' },
];

export function Reviews() {
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 px-4 pb-6 pt-[60px] sm:px-[25px] sm:pt-[72px]">
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-2">
        <h2 id="reviews-title" className="heading text-[24px] sm:text-[30px] sm:leading-[42px]">120,000+ 5-star reviews</h2>
        <span className="flex items-center gap-2 pb-1.5 text-[14px] text-body">
          <Stars value={4.8} /> 4.8/5 average
        </span>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
        {REVIEWS.map((r) => (
          <figure key={r.name} className="flex min-h-[260px] w-[82vw] shrink-0 snap-start flex-col border border-line bg-white px-[25px] py-[26px] sm:w-auto">
            <Stars value={5} />
            <h3 className="mb-2.5 mt-3 font-serif text-[18px] font-bold text-ink">{r.title}</h3>
            <blockquote className="mb-8 text-[14px] leading-[22px] text-body">{r.body}</blockquote>
            <figcaption className="mt-auto border-t border-line pt-4 text-[14px] text-[#555]">{r.name}, Verified Customer</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
