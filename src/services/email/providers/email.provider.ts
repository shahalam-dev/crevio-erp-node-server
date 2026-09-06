export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string | undefined;
  from?: string | undefined;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}
