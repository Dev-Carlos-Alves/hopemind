import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends e-mails through SMTP (e.g. Gmail with an app password). Configure with SMTP_HOST,
 * SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM. Without them, development prints the message
 * to the log (so the reset code can be tested locally) and production only logs a warning.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  get configured() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  /** Returns true when the message was handed to the SMTP server. Never throws. */
  async send(mail: OutgoingMail): Promise<boolean> {
    if (!this.configured) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn('E-mail não enviado: configure SMTP_HOST, SMTP_USER e SMTP_PASS.');
      } else {
        this.logger.log(`[e-mail de desenvolvimento] para ${mail.to} — ${mail.subject}\n${mail.text}`);
      }
      return false;
    }
    try {
      this.transporter ??= nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: Number(process.env.SMTP_PORT ?? 465) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await this.transporter.sendMail({ from: process.env.MAIL_FROM ?? `HopeMind <${process.env.SMTP_USER}>`, ...mail });
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar e-mail: ${(err as Error).message}`);
      return false;
    }
  }
}
