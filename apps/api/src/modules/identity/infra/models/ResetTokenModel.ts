import { Schema, model, Types } from 'mongoose';

/** One-time password reset link. Only the hash is stored, like refresh tokens. */
export interface IResetTokenDoc {
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
}

const resetTokenSchema = new Schema<IResetTokenDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
resetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ResetTokenModel = model<IResetTokenDoc>('ResetToken', resetTokenSchema);
