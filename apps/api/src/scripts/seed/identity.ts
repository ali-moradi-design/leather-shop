import type { repos } from '../../shared/composition/repos';
import { passwordHasher } from '../../modules/identity';

type Repos = typeof repos;

const SECTIONS = ['books', 'users', 'roles', 'permissions', 'orders', 'reviews', 'reports', 'discounts'] as const;
const CRUD = ['create', 'read', 'update', 'delete'] as const;

export function basePermissions() {
  const perms: { slug: string; name: string; description: string; section: string }[] = [];
  for (const section of SECTIONS) {
    for (const action of CRUD) {
      perms.push({
        slug: `${section}:${action}`,
        name: `${section} ${action}`,
        description: `Can ${action} ${section}`,
        section,
      });
    }
  }
  const extras = [
    { slug: 'orders:read-own', name: 'orders read own', description: 'Read own orders', section: 'orders' },
    { slug: 'orders:update-status', name: 'orders update status', description: 'Update order status', section: 'orders' },
    { slug: 'reviews:update-own', name: 'reviews update own', description: 'Update own reviews', section: 'reviews' },
    { slug: 'reviews:delete-own', name: 'reviews delete own', description: 'Delete own reviews', section: 'reviews' },
    { slug: 'users:read-own', name: 'users read own', description: 'Read own profile', section: 'users' },
    { slug: 'users:update-own', name: 'users update own', description: 'Update own profile', section: 'users' },
    { slug: 'reports:analytics', name: 'reports analytics', description: 'View analytics', section: 'reports' },
    { slug: 'reports:manage', name: 'reports manage', description: 'Manage issue reports', section: 'reports' },
    { slug: 'reports:issues:create', name: 'reports issues create', description: 'Create issue reports', section: 'reports' },
    { slug: 'admin:dashboard', name: 'admin dashboard', description: 'Access admin dashboard endpoints', section: 'admin' },
  ];
  return [...perms, ...extras];
}

export const CUSTOMER_SLUGS = [
  'books:read',
  'orders:create',
  'orders:read-own',
  'reviews:create',
  'reviews:read',
  'reviews:update-own',
  'reviews:delete-own',
  'reports:issues:create',
  'users:read-own',
  'users:update-own',
];

export async function seedIdentity(repos: Repos): Promise<void> {
  const defs = basePermissions();
  for (const def of defs) {
    await repos.permissions.upsertBySlug(def.slug, def);
  }
  const allPerms = await repos.permissions.list();

  const adminRole = await repos.roles.upsertByName('admin', {
    name: 'admin',
    description: 'Full access',
    permissions: allPerms.map((p) => p.id),
  });

  const customerPermIds = allPerms
    .filter((p) => CUSTOMER_SLUGS.includes(p.slug))
    .map((p) => p.id);
  await repos.roles.upsertByName('customer', {
    name: 'customer',
    description: 'Default customer role',
    permissions: customerPermIds,
  });

  const passwordHash = await passwordHasher.hash('Admin123!');
  const existingAdmin = await repos.users.findByEmail('admin@bookstore.local');
  if (existingAdmin) {
    await repos.users.update(existingAdmin.id, {
      name: 'Admin',
      passwordHash,
      roles: [adminRole.id],
      isActive: true,
    });
  } else {
    await repos.users.create({
      name: 'Admin',
      email: 'admin@bookstore.local',
      passwordHash,
      roles: [adminRole.id],
      isActive: true,
    });
  }
}
