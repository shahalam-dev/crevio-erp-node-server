import { BaseJob } from './base.job.js';

interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export class EmailJob extends BaseJob<EmailJobData> {
  name = 'send-email';

  async handle(data: EmailJobData): Promise<void> {
    // Simulate email sending
    console.log(`📧 Sending email to ${data.to}`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Template: ${data.template}`);

    // In production, use a real email service like SendGrid, Nodemailer, etc.
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`✅ Email sent to ${data.to}`);
  }
}
