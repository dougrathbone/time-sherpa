import { ConsoleEmailService, createEmailService } from '../email';

describe('Email Services', () => {
  describe('ConsoleEmailService', () => {
    let consoleLogSpy: jest.SpyInstance;
    let emailService: ConsoleEmailService;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      emailService = new ConsoleEmailService();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should log email to console', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test HTML Body</p>',
        textBody: 'Test Text Body',
      };

      await emailService.sendEmail(emailOptions);

      expect(consoleLogSpy).toHaveBeenCalledWith('=== EMAIL SENT ===');
      expect(consoleLogSpy).toHaveBeenCalledWith('To: test@example.com');
      expect(consoleLogSpy).toHaveBeenCalledWith('Subject: Test Subject');
      expect(consoleLogSpy).toHaveBeenCalledWith('--- HTML Body ---');
      expect(consoleLogSpy).toHaveBeenCalledWith('<p>Test HTML Body</p>');
      expect(consoleLogSpy).toHaveBeenCalledWith('--- Text Body ---');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test Text Body');
    });

    it('should handle email without text body', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test HTML Body</p>',
      };

      await emailService.sendEmail(emailOptions);

      expect(consoleLogSpy).not.toHaveBeenCalledWith('--- Text Body ---');
    });
  });

  describe('createEmailService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create ConsoleEmailService by default', () => {
      delete process.env.EMAIL_SERVICE;
      const service = createEmailService();
      expect(service).toBeInstanceOf(ConsoleEmailService);
    });

    it('should create ConsoleEmailService when EMAIL_SERVICE=console', () => {
      process.env.EMAIL_SERVICE = 'console';
      const service = createEmailService();
      expect(service).toBeInstanceOf(ConsoleEmailService);
    });

    it('should create ConsoleEmailService when EMAIL_SERVICE is unknown', () => {
      process.env.EMAIL_SERVICE = 'unknown';
      const service = createEmailService();
      expect(service).toBeInstanceOf(ConsoleEmailService);
    });
  });
}); 