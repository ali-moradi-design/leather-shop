import type { repos } from '../../shared/composition/repos';
import { passwordHasher } from '../../modules/identity';
import { FEATURED_COUNT } from './catalog';

type Repos = typeof repos;

const REVIEWERS = ['Daniel R.', 'Sara K.', 'Marcus T.', 'Lena M.', 'Omid A.', 'Julia W.'];

const COMMENTS: [number, string][] = [
  [5, 'Broke in within a week and they look better every month. Better than pairs costing twice as much.'],
  [5, 'The stitching and the leather are flawless. Comfortable right out of the box.'],
  [4, 'Great quality. Runs a little big, so I went half a size down as suggested.'],
  [5, 'My go-to pair for work and weekends. Gets compliments every time.'],
  [4, 'Beautiful leather and solid build. Took a few days to soften up.'],
];

/** Demo reviews for the featured products (only when there are no reviews yet). */
export async function seedReviews(repos: Repos): Promise<void> {
  const { total } = await repos.reviews.list({ page: 1, limit: 1 });
  if (total > 0) return;

  const customerRole = (await repos.roles.list()).find((r) => r.name === 'customer');
  const passwordHash = await passwordHasher.hash('Reviewer123!');
  const users = [];
  for (const [i, name] of REVIEWERS.entries()) {
    const email = `reviewer${i + 1}@weltandgrain.local`;
    users.push(
      (await repos.users.findByEmail(email)) ??
        (await repos.users.create({ name, email, passwordHash, roles: customerRole ? [customerRole.id] : [], isActive: true })),
    );
  }

  const { data: products } = await repos.products.list({ featured: true, page: 1, limit: FEATURED_COUNT });
  for (const [pi, product] of products.entries()) {
    const count = 2 + (pi % 3);
    for (let k = 0; k < count; k++) {
      const [rating, comment] = COMMENTS[(pi + k) % COMMENTS.length];
      await repos.reviews.create({ product: product.id, user: users[(pi + k) % users.length].id, rating, comment });
    }
    const { avg, count: n } = await repos.reviews.ratingSummary(product.id);
    await repos.products.setRating(product.id, avg, n);
  }
}
