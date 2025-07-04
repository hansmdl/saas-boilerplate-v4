import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, text: string) {
    // In a real application, you would use a transactional email service
    // like SendGrid, Postmark, or Amazon SES.
    // For this example, we'll just log the email to the console.
    console.log(`Sending email to ${to} with subject "${subject}"`);
    console.log(`Body: ${text}`);
    return Promise.resolve();
  }
}
