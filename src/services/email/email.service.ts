import type { EmailProvider, SendEmailOptions } from './providers/email.provider';

export class EmailService {
  constructor(private provider: EmailProvider) {}

  async send(options: SendEmailOptions): Promise<void> {
    await this.provider.send(options);
  }
}
