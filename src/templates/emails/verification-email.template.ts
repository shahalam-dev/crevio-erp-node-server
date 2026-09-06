export interface VerificationEmailData {
  verificationUrl: string;
  userName: string;
  expiresInMinutes: number;
}

export const buildVerificationEmail = (
  data: VerificationEmailData
): { html: string; text: string } => {
  const { verificationUrl, userName, expiresInMinutes } = data;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Verify your email</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for signing up. Please verify your email address by clicking the button below. This link will expire in ${expiresInMinutes} minutes.</p>
      <a href="${verificationUrl}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin: 16px 0;">Verify Email</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;

  const text = `Hi ${userName},\n\nPlease verify your email by visiting the following link (expires in ${expiresInMinutes} minutes):\n${verificationUrl}\n\nIf you didn't create an account, you can safely ignore this email.`;

  return { html, text };
};
