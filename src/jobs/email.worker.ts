import { Worker } from 'bullmq';

import { env } from '../config/env';
import { EmailService } from '../services/email/email.service';
import { SmtpEmailProvider } from '../services/email/providers/smtp.provider';

import { EMAIL_QUEUE_NAME, redisConnection, type EmailJobData } from './queue';

const emailProvider = new SmtpEmailProvider();
const emailService = new EmailService(emailProvider);

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async job => {
    const { to, subject, html, text, from } = job.data;

    await emailService.send({
      to,
      subject,
      html,
      text,
      from,
    });

    console.log(`✅ Email sent to ${to} | Job: ${job.id}`);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

emailWorker.on('failed', (job, error) => {
  console.error(`❌ Email job failed: ${job?.id}`, error);
});

emailWorker.on('error', error => {
  console.error('❌ Email worker error:', error);
});

console.log('📧 Email worker started');
console.log(`📦 Environment: ${env.NODE_ENV}`);
