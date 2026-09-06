import { env } from '../config/env';
import { buildVerificationEmail } from '../templates/emails/verification-email.template';

import { emailQueue, type EmailJobData } from './queue';

export interface SendVerificationEmailJobData {
  to: string;
  userName: string;
  token: string;
}

const parseDurationToMinutes = (duration: string): number => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15;

  const [, valueStr, unitStr] = match;
  if (!valueStr || !unitStr) return 15;

  const value = parseInt(valueStr, 10);
  const unit = unitStr as 's' | 'm' | 'h' | 'd';

  const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
    s: 1 / 60,
    m: 1,
    h: 60,
    d: 60 * 24,
  };

  return Math.round(value * multipliers[unit]);
};

export class EmailJob {
  static async add(data: EmailJobData): Promise<void> {
    await emailQueue.add('send-email', data);
  }

  static async sendVerificationEmail(data: SendVerificationEmailJobData): Promise<void> {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${data.token}`;
    const expiresInMinutes = parseDurationToMinutes(env.EMAIL_VERIFICATION_EXPIRES_IN);

    const { html, text } = buildVerificationEmail({
      verificationUrl,
      userName: data.userName,
      expiresInMinutes,
    });

    await EmailJob.add({
      to: data.to,
      subject: 'Verify your email',
      html,
      text,
    });
  }
}
