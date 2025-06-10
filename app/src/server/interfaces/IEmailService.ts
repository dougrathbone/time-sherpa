export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface IEmailService {
  /**
   * Sends an email.
   */
  sendEmail(options: EmailOptions): Promise<void>;
} 