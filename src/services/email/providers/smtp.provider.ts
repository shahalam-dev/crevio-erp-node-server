import nodemailer from 'nodemailer';

import { env } from '../../../config/env';

import type { EmailProvider, SendEmailOptions } from './email.provider';

export class SmtpEmailProvider implements EmailProvider {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: options.from ?? env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.text !== undefined && { text: options.text }),
    });
  }
}
