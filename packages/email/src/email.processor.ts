import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

@Injectable()
@Processor('email')
export class EmailProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(EmailProcessor.name);
  
  constructor(private readonly emailService: EmailService) {
    super(); // ¡Crucial! Llama al constructor de WorkerHost
    this.logger.log('🔍 Email processor initializing...');
  }

  onModuleInit() {
    this.logger.log('💬 Email processor ready - NestJS configuration complete');
    this.logger.log(`💬 Redis connection: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
    this.logger.log('🔔 NOTA: El procesador de email está correctamente configurado como worker');
    this.logger.log('📰 IMPORTANTE: Verifica que no aparezcan advertencias de "Redis minimum version"');
    this.logger.log('⏰ El worker está esperando trabajos de email...');
  }
  
  // Eliminamos el método clearQueueOnStartup ya que no tenemos acceso a getQueue directamente

  // Este método es llamado automáticamente por BullMQ para procesar cada trabajo
  async process(job: Job<{ email: string; token: string }>): Promise<void> {
    this.logger.log(`📧 Procesando email: ${job.name} (ID: ${job.id})`);
    const { email, token } = job.data;
    
    this.logger.log(`📧 Datos: email=${email}, token=${token.substring(0, 8)}...`);
    this.logger.log(`📧 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  
    try {
      switch (job.name) {
        case 'sendPasswordResetEmail':
          this.logger.log('📧 Procesando email de reseteo de contraseña');
          await this.handlePasswordReset(email, token);
          this.logger.log('✅ Email de reseteo enviado exitosamente');
          break;
          
        case 'sendEmailVerificationEmail':
          this.logger.log('📧 Procesando email de verificación');
          await this.handleEmailVerification(email, token);
          this.logger.log('✅ Email de verificación enviado exitosamente');
          break;
          
        default:
          this.logger.warn(`⚠️ Tipo de trabajo desconocido: ${job.name}`);
          break;
      }
      
      return; // Trabajo completado exitosamente
      
    } catch (error: any) {
      this.logger.error(`❌ Error procesando email ${job.name}:`, error?.message || 'error desconocido');
      throw error; // Re-lanzar para que BullMQ maneje el error
    }
  }

  private async handlePasswordReset(email: string, token: string): Promise<void> {
    this.logger.log(`📧 Procesando reseteo de contraseña para: ${email}`);
    
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
    this.logger.log(`🔗 Link de reseteo generado: ${resetLink}`);
    
    try {
      const htmlContent = `
        <h1>Reset your password</h1>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p>${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
      `;
      
      await this.emailService.sendEmail(
        email,
        'Reset your password',
        `Click the link to reset your password: ${resetLink}`,
        htmlContent
      );
      
      this.logger.log(`✅ Email de reseteo enviado a ${email}`);
    } catch (error: any) {
      this.logger.error(`❌ Error al enviar email de reseteo a ${email}:`, error?.message || error);
      throw error;
    }
  }

  private async handleEmailVerification(email: string, token: string): Promise<void> {
    this.logger.log(`📧 Procesando verificación para: ${email}`);
    
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email/${token}`;
    this.logger.log(`🔗 Link de verificación generado: ${verificationLink}`);
    
    try {
      const htmlContent = `
        <h1>Verify your email</h1>
        <p>Click the button below to verify your email:</p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
      `;
      
      await this.emailService.sendEmail(
        email,
        'Verify your email',
        `Click the link to verify your email: ${verificationLink}`,
        htmlContent
      );
      
      this.logger.log(`✅ Email de verificación enviado a ${email}`);
    } catch (error: any) {
      this.logger.error(`❌ Error al enviar email de verificación a ${email}:`, error?.message || 'error desconocido');
      throw error;
    }
  }
}
