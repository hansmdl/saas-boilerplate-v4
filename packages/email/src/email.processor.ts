import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

/**
 * Processor for email queue tasks
 * Handles sending emails for 2FA codes and security notifications
 */
@Injectable()
@Processor('email')
export class EmailProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(EmailProcessor.name);
  
  constructor(private readonly emailService: EmailService) {
    super(); // Call WorkerHost constructor
    this.logger.log('🔍 Email processor initializing...');
  }

  /**
   * BullMQ process method - handles all incoming jobs
   */
  async process(job: Job): Promise<any> {
    const { name, data } = job;
    this.logger.log(`⚙️ Processing email job: ${name} (ID: ${job.id})`);
    
    try {
      switch (name) {
        case 'twoFactorCode':
          await this.handleTwoFactorCode(data.email, data.code);
          break;
        case 'securityNotification':
          await this.handleSecurityNotification(data.email, data.subject, data.text);
          break;
        default:
          this.logger.warn(`🟡 Unsupported email job type: ${name}`);
          throw new Error(`Unsupported email job type: ${name}`);
      }
      
      return { success: true };
    } catch (error: any) {
      this.logger.error(`❌ Error processing email job ${name}:`, error?.message || error);
      throw error;
    }
  }

  /**
   * Sends two-factor authentication code email
   */
  private async handleTwoFactorCode(email: string, code: string): Promise<void> {
    this.logger.log(`📧 Enviando código 2FA a: ${email}`);
    
    try {
      const htmlContent = `
        <h1>Código de verificación</h1>
        <p>Tu código de verificación de dos factores es:</p>
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>Este código expirará en 10 minutos.</p>
        <p>Si no solicitaste este código, ignora este correo. Alguien podría estar intentando acceder a tu cuenta.</p>
      `;
      
      await this.emailService.sendEmail(
        email,
        'Código de verificación de dos factores',
        `Tu código de verificación de dos factores es: ${code}. Este código expirará en 10 minutos.`,
        htmlContent
      );
      
      this.logger.log(`✅ Email con código 2FA enviado a ${email}`);
    } catch (error: any) {
      this.logger.error(`❌ Error al enviar código 2FA a ${email}:`, error?.message || error);
      throw error;
    }
  }

  /**
   * Sends security notification emails
   */
  private async handleSecurityNotification(email: string, subject: string, text: string): Promise<void> {
    this.logger.log(`📧 Enviando notificación de seguridad a: ${email}`);
    
    try {
      const htmlContent = `
        <h1>Notificación de seguridad</h1>
        <p>${text}</p>
        <p>Si no realizaste esta acción, por favor contacta inmediatamente con soporte para asegurar tu cuenta.</p>
        <p>Fecha y hora: ${new Date().toLocaleString()}</p>
      `;
      
      await this.emailService.sendEmail(
        email,
        subject,
        `${text} Si no realizaste esta acción, por favor contacta inmediatamente con soporte para asegurar tu cuenta.`,
        htmlContent
      );
      
      this.logger.log(`✅ Notificación de seguridad enviada a ${email}`);
    } catch (error: any) {
      this.logger.error(`❌ Error al enviar notificación de seguridad a ${email}:`, error?.message || error);
      throw error;
    }
  }

  /**
   * NestJS lifecycle hook called when the module is initialized
   */
  onModuleInit() {
    this.logger.log('💬 Email processor ready - NestJS configuration complete');
    this.logger.log(`💬 Redis connection: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
    this.logger.log('🔔 NOTA: El procesador de email está correctamente configurado como worker');
    this.logger.log('📰 IMPORTANTE: Verifica que no aparezcan advertencias de "Redis minimum version"');
    this.logger.log('⏰ El worker está esperando trabajos de email...');
  }
}
