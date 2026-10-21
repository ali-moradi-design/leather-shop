import { connectDb } from '../shared/config/db';
import { repos } from '../shared/composition/repos';
import { seedIdentity } from './seed/identity';
import { seedCatalog, FEATURED_ISBNS } from './seed/catalog';
import { seedPromotions } from './seed/promotions';

export type SeedOptions = {
  /** When true, seed only a handful of books (for automated tests). */
  minimalBooks?: boolean;
};

export async function runSeed(options: SeedOptions = {}): Promise<void> {
  await seedIdentity(repos);
  await seedCatalog(repos, options);
  await seedPromotions(repos);
}

async function main() {
  await connectDb();
  console.log('Seeding...');
  await runSeed();
  const bookCount = await repos.books.count();
  console.log(`Books upserted (catalog count: ${bookCount}); featured: ${FEATURED_ISBNS.size}`);
  console.log('Admin user: admin@bookstore.local / Admin123!');
  console.log('Sample discounts: WELCOME10 (10%), FLAT5 ($5)');
  console.log('Seed complete.');
  process.exit(0);
}

const isCli =
  typeof process.argv[1] === 'string' &&
  (process.argv[1].endsWith('scripts/seed.ts') || process.argv[1].endsWith('scripts/seed.js'));

if (isCli) {
  main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
