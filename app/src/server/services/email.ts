import { IEmailService, EmailOptions } from '../interfaces/IEmailService';
import nodemailer from 'nodemailer';
import { TransportOptions } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

/**
 * Console email service for testing - logs emails to console instead of sending
 */
export class ConsoleEmailService implements IEmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    console.log('=== EMAIL SENT ===');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('--- HTML Body ---');
    console.log(options.htmlBody);
    if (options.textBody) {
      console.log('--- Text Body ---');
      console.log(options.textBody);
    }
    console.log('==================');
  }
}

/**
 * Nodemailer email service for production email sending
 */
export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor(config: SMTPTransport.Options | any) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@timesherpa.app',
        to: options.to,
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }
}

/**
 * Factory function to create the appropriate email service based on environment
 */
export function createEmailService(): IEmailService {
  const emailService = process.env.EMAIL_SERVICE || 'console';

  if (emailService === 'console') {
    return new ConsoleEmailService();
  }

  if (emailService === 'smtp') {
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
    return new NodemailerEmailService(smtpConfig);
  }

  if (emailService === 'gmail') {
    const gmailConfig = {
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    };
    return new NodemailerEmailService(gmailConfig);
  }

  // Default to console
  return new ConsoleEmailService();
} 