export interface SavedAddress {
  id: string;
  label?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  /** Made at guest checkout; becomes a normal account once a password is set. */
  guest: boolean;
  addresses: SavedAddress[];
  roles: string[];
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  roles: unknown;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash?: string;
  guest?: boolean;
  roles?: string[];
  isActive?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  passwordHash?: string;
  guest?: boolean;
  addresses?: Omit<SavedAddress, 'id'>[] | SavedAddress[];
  roles?: string[];
  isActive?: boolean;
}
