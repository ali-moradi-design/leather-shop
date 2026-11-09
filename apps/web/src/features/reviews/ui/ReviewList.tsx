import { apiGetJson } from '@/shared/api';
import { Stars } from '@/shared/ui';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { name?: string } | string;
}

interface Summary {
  avg: number;
  count: number;
  /** reviews with 1…5 stars */
  stars: number[];
}

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

/**
 * Rating summary and latest reviews, read fresh on each visit (a dynamic hole in
 * the product page). Both requests start together.
 */
export async function ReviewList({ productId }: { productId: string }) {
  const [{ data: summary }, { data }] = await Promise.all([
    apiGetJson<{ data: Summary }>(`/reviews/summary?product=${productId}`, { cache: 'no-store' }),
    apiGetJson<{ data: Review[] }>(`/reviews?product=${productId}&limit=20`, { cache: 'no-store' }),
  ]);
  if (data.length === 0) {
    return <p className="text-[14px] text-mute">No reviews yet. Be the first to review this product.</p>;
  }
  return (
    <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div>
        <p className="heading text-[44px] leading-none">{summary.avg.toFixed(1)}</p>
        <p className="mt-2 flex items-center gap-2 text-[14px]">
          <Stars value={summary.avg} /> {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
        </p>
        <dl className="mt-5 space-y-1.5 text-[13px]">
          {[5, 4, 3, 2, 1].map((n) => {
            const count = summary.stars[n - 1] ?? 0;
            const share = summary.count ? count / summary.count : 0;
            return (
              <div key={n} className="grid grid-cols-[48px_1fr_28px] items-center gap-2">
                <dt>{n} star{n === 1 ? '' : 's'}</dt>
                <dd className="h-2 bg-soft" aria-hidden>
                  <span className="block h-full rounded-r-[4px] bg-ink" style={{ width: `${share * 100}%` }} />
                </dd>
                <dd className="text-right text-mute">{count}</dd>
              </div>
            );
          })}
        </dl>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {data.map((r) => (
          <li key={r.id} className="border border-line p-6 text-[14px]" data-testid="review">
            <Stars value={r.rating} />
            {r.comment && <p className="mt-2">{r.comment}</p>}
            <p className="mt-4 text-mute">
              {typeof r.user === 'object' && r.user.name ? r.user.name : 'Customer'} · {day.format(new Date(r.createdAt))}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
