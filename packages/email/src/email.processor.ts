import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { EmailService } from './email.service';

@Processor('email')
@Injectable()
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<{ email: string; token: string }>): Promise<void> {
    const { email, token } = job.data;

    switch (job.name) {
      case 'sendPasswordResetEmail':
        await this.handlePasswordReset(email, token);
        break;
      case 'sendEmailVerificationEmail':
        await this.handleEmailVerification(email, token);
        break;
      default:
        break;
    }
  }

  private async handlePasswordReset(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    await this.emailService.sendEmail(
      email,
      'Reset your password',
      `Click the link to reset your password: ${resetLink}`,
    );
  }

  private async handleEmailVerification(email: string, token: string): Promise<void> {
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email/${token}`;
    await this.emailService.sendEmail(
      email,
      'Verify your email',
      `Click the link to verify your email: ${verifyLink}`,
    );
  }
}
