import { Schema, model } from 'mongoose';

export interface ISubscriberDoc {
  email: string;
  /** Random, so the unsubscribe link cannot be guessed from the address. */
  token: string;
  source: string;
  unsubscribedAt?: Date | null;
  createdAt: Date;
}

const subscriberSchema = new Schema<ISubscriberDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    source: { type: String, default: 'footer' },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
subscriberSchema.index({ unsubscribedAt: 1, createdAt: -1 });

export const SubscriberModel = model<ISubscriberDoc>('Subscriber', subscriberSchema);
