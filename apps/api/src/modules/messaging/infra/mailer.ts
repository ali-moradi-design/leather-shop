import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@shared/config/env';
import { logger } from '@shared/logging/logger';
import { EmailModel, type EmailStatus } from './EmailModel';
import type { RenderedEmail } from '../templates';

const log = logger.child({ module: 'mailer' });

export interface OutgoingEmail extends RenderedEmail {
  to: string;
  template: string;
}

export interface IMailer {
  /** Never throws: a failed email must not undo the order or sign-up that sent it. */
  send(email: OutgoingEmail): Promise<EmailStatus>;
}

/**
 * Sends through SMTP when SMTP_URL is set (any provider: Resend, Postmark, SES,
 * Mailpit locally). Every message is also written to the outbox collection so
 * staff can see what went out; without SMTP the outbox is where mail lands.
 */
export class Mailer implements IMailer {
  private readonly transport: Transporter | null;

  constructor(
    smtpUrl = env.SMTP_URL,
    private readonly from = env.MAIL_FROM,
  ) {
    this.transport = smtpUrl ? nodemailer.createTransport(smtpUrl) : null;
  }

  get mode(): 'smtp' | 'outbox' {
    return this.transport ? 'smtp' : 'outbox';
  }

  async send(email: OutgoingEmail): Promise<EmailStatus> {
    let status: EmailStatus = 'outbox';
    let error: string | undefined;
    if (this.transport) {
      try {
        await this.transport.sendMail({
          from: this.from,
          to: email.to,
          subject: email.subject,
          text: email.text,
          html: email.html,
        });
        status = 'sent';
      } catch (err) {
        status = 'failed';
        error = err instanceof Error ? err.message : String(err);
        log.error('email failed', { to: email.to, template: email.template, error });
      }
    }
    try {
      // once the real email is out, the copy must not let staff use someone's reset link
      const stored = status === 'sent' ? { ...email, text: redact(email.text), html: redact(email.html) } : email;
      await EmailModel.create({ ...stored, status, error });
    } catch (err) {
      log.error('could not store email', { error: err instanceof Error ? err.message : String(err) });
    }
    return status;
  }
}

/** Hides one-time tokens (password reset, unsubscribe) in the stored copy. */
export function redact(body: string): string {
  return body.replace(/token=[A-Za-z0-9_-]+/g, 'token=[removed]');
}

export const mailer = new Mailer();
