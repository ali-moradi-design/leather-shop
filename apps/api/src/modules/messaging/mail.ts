/** Email only (no routes), so other modules can import it without a cycle. */
export { mailer, type IMailer } from './infra/mailer';
export { templates } from './templates';
