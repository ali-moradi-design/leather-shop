import { Schema, model } from 'mongoose';

export type EmailStatus = 'sent' | 'outbox' | 'failed';

export interface IEmailDoc {
  to: string;
  subject: string;
  text: string;
  html: string;
  template: string;
  status: EmailStatus;
  error?: string;
  createdAt: Date;
}

const emailSchema = new Schema<IEmailDoc>(
  {
    to: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true },
    text: { type: String, required: true },
    html: { type: String, required: true },
    template: { type: String, required: true },
    status: { type: String, enum: ['sent', 'outbox', 'failed'], required: true },
    error: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
emailSchema.index({ to: 1, createdAt: -1 });
// the outbox is a log, not an archive: entries go after 90 days
emailSchema.index({ createdAt: -1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const EmailModel = model<IEmailDoc>('Email', emailSchema);
