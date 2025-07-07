import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter!: nodemailer.Transporter; // Using definite assignment assertion

  constructor() {
    // Get email credentials from environment variables directly
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;
    
    console.log('🔍 Email Service initialization:');
    console.log(`🔑 Email User: ${EMAIL_USER ? EMAIL_USER : 'NOT FOUND'}`); 
    console.log(`🔑 Email Pass: ${EMAIL_PASS ? '****' + EMAIL_PASS.slice(-4) : 'NOT FOUND'}`);
    
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.error('❌ Email credentials missing in environment variables. Email will not work!');
    } else {
      console.log('✅ Email credentials found in environment variables');
    }
    
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
        debug: true, // Enable debug output
      });
      console.log('✅ Nodemailer transporter created successfully');
      
      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP connection error:', error);
        } else {
          console.log('✅ SMTP server is ready to take messages');
        }
      });
    } catch (error) {
      console.error('❌ Error creating transporter:', error);
    }
  }

  /**
   * Envía un correo electrónico utilizando las credenciales configuradas
   * @param to Destinatario del correo
   * @param subject Asunto del correo
   * @param text Contenido en texto plano
   * @param html Contenido en HTML (opcional)
   * @returns Información del envío o undefined en caso de error
   */
  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<any> {
    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    
    try {
      const EMAIL_USER = process.env.EMAIL_USER || '';
      console.log(`📧 Sending from: ${EMAIL_USER}`);
      
      const mailOptions = {
        from: `"SaaS Boilerplate" <${EMAIL_USER}>`,
        to,
        subject,
        text,
        html: html || text,
      };

      console.log('📧 Mail options prepared, attempting to send...');
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 Email send response received:');
      console.log(`✅ Message sent: ${info.messageId}`);
      console.log(`✅ Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`✅ Response: ${JSON.stringify(info)}`);
      
      return info;
    } catch (error: any) { // Type assertion for error handling
      console.error('❌ ERROR SENDING EMAIL:', error);
      console.error(`❌ Error name: ${error.name || 'Unknown'}`);
      console.error(`❌ Error message: ${error.message || 'No message'}`);
      if (error.stack) console.error(`❌ Stack trace: ${error.stack}`);
      
      // Check common Gmail authentication issues
      if (error.message?.includes('Invalid login')) {
        console.error('❌ Gmail authentication failed: Check that your app password is correct');
      } else if (error.message?.includes('security settings')) {
        console.error('❌ Gmail security settings blocking access: Enable less secure apps or use app password');
      }
      
      // Still log the attempted email for debugging
      console.log(`❌ Failed sending email to ${to} with subject "${subject}"`);
      throw error;
    }
  }
}
