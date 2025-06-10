import * as cron from 'node-cron';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IEmailService } from '../interfaces/IEmailService';
import { getRefreshTokenAuth } from './auth';
import { getUserCalendarEvents } from './calendar';
import { analyzeCalendarData, CalendarAnalysis } from './gemini';
import { generateDailySummaryEmail, generateWeeklySummaryEmail } from './emailTemplates';

export class EmailScheduler {
  private dailyJob: cron.ScheduledTask | null = null;
  private weeklyJob: cron.ScheduledTask | null = null;

  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService,
    private dashboardUrl: string
  ) {}

  start(): void {
    console.log('Starting email scheduler...');

    // Daily job - runs every day at 8 AM
    this.dailyJob = cron.schedule('0 8 * * *', async () => {
      console.log('Running daily email job...');
      await this.sendScheduledEmails('daily');
    });

    // Weekly job - runs every Monday at 8 AM
    this.weeklyJob = cron.schedule('0 8 * * 1', async () => {
      console.log('Running weekly email job...');
      await this.sendScheduledEmails('weekly');
    });

    // Start the jobs
    this.dailyJob.start();
    this.weeklyJob.start();

    console.log('Email scheduler started successfully');
  }

  stop(): void {
    if (this.dailyJob) {
      this.dailyJob.stop();
    }
    if (this.weeklyJob) {
      this.weeklyJob.stop();
    }
    console.log('Email scheduler stopped');
  }

  private async sendScheduledEmails(frequency: 'daily' | 'weekly'): Promise<void> {
    try {
      // Get all users subscribed to this frequency
      const users = await this.userRepository.findSubscribedUsersByFrequency(frequency);
      console.log(`Found ${users.length} users subscribed to ${frequency} emails`);

      // Process each user
      for (const user of users) {
        try {
          await this.sendEmailToUser(user, frequency);
        } catch (error) {
          console.error(`Failed to send ${frequency} email to ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error in ${frequency} email job:`, error);
    }
  }

  private async sendEmailToUser(user: any, frequency: 'daily' | 'weekly'): Promise<void> {
    try {
      // Get auth client using refresh token
      const auth = await getRefreshTokenAuth(user.refreshToken);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (frequency === 'daily') {
        startDate.setDate(startDate.getDate() - 1); // Yesterday
      } else {
        startDate.setDate(startDate.getDate() - 7); // Last week
      }

      // Fetch calendar events
      const events = await getUserCalendarEvents(auth, startDate.toISOString(), endDate.toISOString());

      if (events.length === 0) {
        console.log(`No events found for ${user.email} in the ${frequency} period`);
        return;
      }

      // Analyze events
      const analysis = await analyzeCalendarData(events) as CalendarAnalysis;

      // Generate email content
      const emailContent = frequency === 'daily'
        ? generateDailySummaryEmail({
            userName: user.email.split('@')[0], // Extract name from email
            period: 'daily',
            analysis,
            dashboardUrl: this.dashboardUrl,
          })
        : generateWeeklySummaryEmail({
            userName: user.email.split('@')[0],
            period: 'weekly',
            analysis,
            dashboardUrl: this.dashboardUrl,
          });

      // Send email
      await this.emailService.sendEmail({
        to: user.email,
        subject: emailContent.subject,
        htmlBody: emailContent.htmlBody,
        textBody: emailContent.textBody,
      });

      console.log(`Successfully sent ${frequency} email to ${user.email}`);
    } catch (error) {
      console.error(`Error sending ${frequency} email to ${user.email}:`, error);
      throw error;
    }
  }

  // Method to manually trigger email sending (useful for testing)
  async sendTestEmail(userEmail: string, frequency: 'daily' | 'weekly'): Promise<void> {
    const user = await this.userRepository.findByGoogleId(userEmail);
    if (!user) {
      throw new Error('User not found');
    }
    await this.sendEmailToUser(user, frequency);
  }
} 