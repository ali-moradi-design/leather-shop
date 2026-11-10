import type { IUserRepository } from '@modules/identity/domain/user.repository';
import type { IRoleRepository } from '@modules/identity/domain/rbac.repository';
import type { IRefreshTokenRepository } from '@modules/identity/domain/refresh-token.repository';
import type { SavedAddress, User } from '@modules/identity/domain/user.entity';
import type { IMailer } from '@modules/messaging/mail';
import type { ITokenService, IPasswordHasher } from './ports';
import { templates } from '@modules/messaging/mail';
import { AppError } from '@shared/errors/AppError';

export interface IResetTokenStore {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  /** Marks the token used and returns its user, or null if unknown, used or expired. */
  consume(tokenHash: string): Promise<string | null>;
}

export type AddressInput = Omit<SavedAddress, 'id' | 'isDefault'> & { isDefault?: boolean };

const RESET_TTL_MS = 60 * 60 * 1000;
const MAX_ADDRESSES = 10;

export function publicAccount(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    guest: user.guest,
    addresses: user.addresses,
  };
}

/**
 * Self-service account features: password reset, guest checkout accounts,
 * profile and password changes, and the address book.
 */
export class AccountService {
  constructor(
    private readonly users: IUserRepository,
    private readonly roles: IRoleRepository,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly tokens: ITokenService,
    private readonly passwords: IPasswordHasher,
    private readonly resetTokens: IResetTokenStore,
    private readonly mailer: IMailer,
    private readonly storefrontUrl: string,
  ) {}

  private async resetLink(userId: string): Promise<string> {
    const token = this.tokens.generateRefreshToken();
    await this.resetTokens.create(userId, this.tokens.hashToken(token), new Date(Date.now() + RESET_TTL_MS));
    return `${this.storefrontUrl}/account/reset-password?token=${token}`;
  }

  private async issueTokenPair(user: User) {
    const accessToken = this.tokens.signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = this.tokens.generateRefreshToken();
    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: this.tokens.hashToken(refreshToken),
      expiresAt: this.tokens.refreshExpiresAt(),
    });
    return { accessToken, refreshToken };
  }

  /** Always succeeds from the caller's view, so it cannot reveal which emails have accounts. */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) return;
    const url = await this.resetLink(user.id);
    await this.mailer.send({ to: user.email, template: 'password-reset', ...templates.passwordReset(user.name, url) });
  }

  /** Sets a new password from an emailed link and signs out every other session. */
  async resetPassword(token: string, password: string): Promise<void> {
    const userId = await this.resetTokens.consume(this.tokens.hashToken(token));
    if (!userId) throw new AppError('This link has expired or was already used. Ask for a new one.', 400);
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) throw new AppError('This link has expired or was already used. Ask for a new one.', 400);
    await this.users.update(user.id, { passwordHash: await this.passwords.hash(password), guest: false });
    await this.refreshTokens.revokeAllForUser(user.id);
    await this.mailer.send({ to: user.email, template: 'password-changed', ...templates.passwordChanged(user.name) });
  }

  /**
   * Guest checkout: a passwordless customer account, signed in right away, with
   * an email to set a password later. An email that already has an account is
   * never signed in this way; its owner gets a sign-in or reset link instead.
   */
  async startGuest(input: { name: string; email: string }) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      if (existing.guest && existing.isActive) {
        const url = await this.resetLink(existing.id);
        await this.mailer.send({ to: email, template: 'guest-welcome', ...templates.guestWelcome(existing.name, url) });
        throw new AppError('You have checked out with this email before. We emailed you a link to set a password and sign in.', 409);
      }
      throw new AppError('An account already uses this email. Please sign in.', 409);
    }
    const customer = await this.roles.findByName('customer');
    if (!customer) throw new AppError('Default customer role missing; run seed first', 500);
    const user = await this.users.create({ name: input.name.trim(), email, roles: [customer.id], guest: true });
    const url = await this.resetLink(user.id);
    await this.mailer.send({ to: email, template: 'guest-welcome', ...templates.guestWelcome(user.name, url) });
    return { user: publicAccount(user), ...(await this.issueTokenPair(user)) };
  }

  async get(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return publicAccount(user);
  }

  /** Changing the email needs the current password, since the email is how accounts are recovered. */
  async updateProfile(userId: string, input: { name?: string; email?: string; currentPassword?: string }) {
    const user = await this.users.findById(userId, { withPassword: true });
    if (!user) throw new AppError('User not found', 404);
    const email = input.email?.trim().toLowerCase();
    const update: { name?: string; email?: string } = {};
    if (input.name !== undefined) update.name = input.name.trim();
    if (email && email !== user.email) {
      if (!user.passwordHash || !input.currentPassword || !(await this.passwords.compare(input.currentPassword, user.passwordHash))) {
        throw new AppError('Enter your current password to change your email', 400, { fieldErrors: { currentPassword: 'Incorrect password' } });
      }
      if (await this.users.findByEmail(email)) {
        throw new AppError('Another account uses this email', 409, { fieldErrors: { email: 'Already in use' } });
      }
      update.email = email;
    }
    const saved = await this.users.update(userId, update);
    return publicAccount(saved!);
  }

  /** Keeps the current session (`keepRefreshToken`) and signs out the rest. */
  async changePassword(userId: string, input: { currentPassword: string; newPassword: string }, keepRefreshToken?: string) {
    const user = await this.users.findById(userId, { withPassword: true });
    if (!user) throw new AppError('User not found', 404);
    if (!user.passwordHash || !(await this.passwords.compare(input.currentPassword, user.passwordHash))) {
      throw new AppError('Your current password is not correct', 400, { fieldErrors: { currentPassword: 'Incorrect password' } });
    }
    await this.users.update(userId, { passwordHash: await this.passwords.hash(input.newPassword) });
    await this.refreshTokens.revokeAllForUser(userId, keepRefreshToken ? this.tokens.hashToken(keepRefreshToken) : undefined);
    await this.mailer.send({ to: user.email, template: 'password-changed', ...templates.passwordChanged(user.name) });
  }

  /** A guest asks for the set-password email again. */
  async sendSetPasswordLink(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const url = await this.resetLink(user.id);
    await this.mailer.send({ to: user.email, template: 'password-reset', ...templates.passwordReset(user.name, url) });
  }

  // Address book. The first address, or one marked default, becomes the default.

  private async saveAddresses(userId: string, list: (SavedAddress | AddressInput)[], defaultIndex?: number) {
    const marked = defaultIndex ?? list.findIndex((a) => a.isDefault);
    const normalized = list.map((a, i) => ({ ...a, isDefault: i === (marked >= 0 ? marked : 0) }));
    const saved = await this.users.update(userId, { addresses: normalized as SavedAddress[] });
    return saved!.addresses;
  }

  async addAddress(userId: string, input: AddressInput) {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.addresses.length >= MAX_ADDRESSES) throw new AppError(`You can save up to ${MAX_ADDRESSES} addresses`, 400);
    // the same address twice is a no-op, so "save this address" at checkout is safe to repeat
    const same = user.addresses.find((a) => sameAddress(a, input));
    if (same) {
      return input.isDefault ? this.saveAddresses(userId, user.addresses, user.addresses.indexOf(same)) : user.addresses;
    }
    const list = [...user.addresses, input];
    return this.saveAddresses(userId, list, input.isDefault ? list.length - 1 : undefined);
  }

  async updateAddress(userId: string, addressId: string, input: AddressInput) {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const index = user.addresses.findIndex((a) => a.id === addressId);
    if (index < 0) throw new AppError('Address not found', 404);
    const list = user.addresses.map((a, i) => (i === index ? { ...a, ...input, id: a.id } : a));
    return this.saveAddresses(userId, list, input.isDefault ? index : undefined);
  }

  async removeAddress(userId: string, addressId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const list = user.addresses.filter((a) => a.id !== addressId);
    if (list.length === user.addresses.length) throw new AppError('Address not found', 404);
    return this.saveAddresses(userId, list);
  }
}

function sameAddress(a: AddressInput | SavedAddress, b: AddressInput | SavedAddress) {
  const norm = (s?: string) => (s ?? '').trim().toLowerCase();
  return (['fullName', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'] as const).every((k) => norm(a[k]) === norm(b[k]));
}
