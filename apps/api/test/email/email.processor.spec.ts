import { EmailProcessor } from '@email/email.processor';
import { EmailService } from '@email/email.service';
import { Job } from 'bullmq';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  const emailServiceMock: jest.Mocked<EmailService> = {
    sendEmail: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'http://localhost:3000';
    processor = new EmailProcessor(emailServiceMock);
  });

  it('should send password reset email', async () => {
    const job = {
      name: 'sendPasswordResetEmail',
      data: { email: 'test@example.com', token: 'token123' },
    } as unknown as Job<{ email: string; token: string }>;

    await processor.process(job);

    expect(emailServiceMock.sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, body] = emailServiceMock.sendEmail.mock.calls[0];
    expect(to).toBe('test@example.com');
    expect(subject).toBe('Reset your password');
    expect(body).toContain('reset-password?token=token123');
  });

  it('should send email verification email', async () => {
    const job = {
      name: 'sendEmailVerificationEmail',
      data: { email: 'verify@example.com', token: 'verifyToken' },
    } as unknown as Job<{ email: string; token: string }>;

    await processor.process(job);

    expect(emailServiceMock.sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, body] = emailServiceMock.sendEmail.mock.calls[0];
    expect(to).toBe('verify@example.com');
    expect(subject).toBe('Verify your email');
    expect(body).toContain('/verify-email/verifyToken');
  });
});
