import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 15_000;

/** "HopeMind <a@b.com>" → { name: 'HopeMind', email: 'a@b.com' }; "a@b.com" → { email: 'a@b.com' }. */
export function parseAddress(value: string): { name?: string; email: string } {
  const m = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { ...(m[1] ? { name: m[1].replace(/^"|"$/g, '') } : {}), email: m[2].trim() } : { email: value.trim() };
}

/**
 * Sends e-mails. Two ways, chosen by the environment:
 *  - BREVO_API_KEY: Brevo's HTTP API (port 443). Use this on Render's free plan, which blocks
 *    outgoing SMTP (ports 25, 465 and 587). The sender in MAIL_FROM must be verified in Brevo.
 *  - SMTP_HOST + SMTP_USER + SMTP_PASS: plain SMTP (e.g. Gmail with an app password).
 * Without either, development prints the message to the log (so the reset code can be tested
 * locally) and production only logs a warning.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  get provider(): 'brevo' | 'smtp' | null {
    if (process.env.BREVO_API_KEY) return 'brevo';
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
    return null;
  }

  get configured() {
    return this.provider !== null;
  }

  private get from() {
    return process.env.MAIL_FROM ?? `HopeMind <${process.env.SMTP_USER ?? 'no-reply@hopemind.app'}>`;
  }

  /** Returns true when the message was accepted by the provider. Never throws. */
  async send(mail: OutgoingMail): Promise<boolean> {
    const provider = this.provider;
    if (!provider) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn('E-mail não enviado: configure BREVO_API_KEY (ou SMTP_HOST, SMTP_USER e SMTP_PASS).');
      } else {
        this.logger.log(`[e-mail de desenvolvimento] para ${mail.to} — ${mail.subject}\n${mail.text}`);
      }
      return false;
    }
    try {
      if (provider === 'brevo') await this.sendWithBrevo(mail);
      else await this.sendWithSmtp(mail);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar e-mail (${provider}): ${(err as Error).message}`);
      return false;
    }
  }

  private async sendWithBrevo(mail: OutgoingMail) {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: parseAddress(this.from),
        to: [{ email: mail.to }],
        subject: mail.subject,
        textContent: mail.text,
        ...(mail.html ? { htmlContent: mail.html } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Brevo respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  private async sendWithSmtp(mail: OutgoingMail) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    this.transporter ??= nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });
    await this.transporter.sendMail({ from: this.from, ...mail });
  }
}
