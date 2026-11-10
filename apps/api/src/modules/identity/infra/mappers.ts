import type { User } from '../domain/user.entity';
import type { Permission } from '../domain/permission.entity';
import type { Role } from '../domain/role.entity';
import type { RefreshTokenRecord } from '../domain/auth.types';

function idOf(doc: { id?: string; _id?: { toString(): string } }): string {
  return doc.id ?? doc._id!.toString();
}

export function mapUser(doc: {
  id?: string;
  _id?: { toString(): string };
  name: string;
  email: string;
  passwordHash?: string;
  guest?: boolean;
  addresses?: { _id: { toString(): string }; label?: string; fullName: string; line1: string; line2?: string; city: string; state?: string; postalCode: string; country: string; isDefault?: boolean }[];
  roles: unknown[];
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
  const roles = (doc.roles ?? []).map((r) => {
    if (r && typeof r === 'object' && '_id' in (r as object)) {
      return (r as { _id: { toString(): string } })._id.toString();
    }
    return String(r);
  });
  return {
    id: idOf(doc),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    guest: doc.guest ?? false,
    addresses: (doc.addresses ?? []).map((a) => ({
      id: a._id.toString(),
      label: a.label,
      fullName: a.fullName,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault ?? false,
    })),
    roles,
    isActive: doc.isActive,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapPermission(doc: {
  id?: string;
  _id?: { toString(): string };
  slug: string;
  name: string;
  description?: string;
  section: string;
  createdAt: Date;
  updatedAt: Date;
}): Permission {
  return {
    id: idOf(doc),
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    section: doc.section,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapRole(doc: {
  id?: string;
  _id?: { toString(): string };
  name: string;
  description?: string;
  permissions: unknown[];
  createdAt: Date;
  updatedAt: Date;
}): Role {
  const raw = doc.permissions ?? [];
  const populated = raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null && 'slug' in (raw[0] as object);
  let permissions: Role['permissions'];
  if (populated) {
    permissions = raw.map((p) => {
      const perm = p as {
        _id?: { toString(): string };
        id?: string;
        slug: string;
        name?: string;
        description?: string;
        section?: string;
      };
      return {
        id: perm.id ?? perm._id!.toString(),
        slug: perm.slug,
        name: perm.name,
        description: perm.description,
        section: perm.section,
      };
    });
  } else {
    permissions = raw.map((p) => String(p));
  }
  return {
    id: idOf(doc),
    name: doc.name,
    description: doc.description,
    permissions,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapRefreshToken(doc: {
  id?: string;
  _id?: { toString(): string };
  user: { toString(): string };
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedByHash?: string | null;
}): RefreshTokenRecord {
  return {
    id: idOf(doc),
    userId: doc.user.toString(),
    tokenHash: doc.tokenHash,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt,
    replacedByHash: doc.replacedByHash,
  };
}
