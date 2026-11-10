import type { IResetTokenStore } from '../application/account.service';
import { ResetTokenModel } from './models/ResetTokenModel';

export class MongooseResetTokenStore implements IResetTokenStore {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    // a new link replaces older unused ones
    await ResetTokenModel.updateMany({ user: userId, usedAt: null }, { usedAt: new Date() });
    await ResetTokenModel.create({ user: userId, tokenHash, expiresAt });
  }

  async consume(tokenHash: string): Promise<string | null> {
    const doc = await ResetTokenModel.findOneAndUpdate(
      { tokenHash, usedAt: null, expiresAt: { $gt: new Date() } },
      { usedAt: new Date() },
    );
    return doc ? doc.user.toString() : null;
  }
}
