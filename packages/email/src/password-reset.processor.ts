import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

/**
 * Processor exclusivo para recuperación de contraseña
 * Maneja el envío de emails para el flujo de "forgot password"
 */
@Injectable()
@Processor('email')
export class PasswordResetProcessor extends WorkerHost {
  private readonly logger = new Logger(PasswordResetProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
    this.logger.log('🔍 PasswordResetProcessor inicializado...');
  }

  /**
   * Procesa solo el job de recuperación de contraseña
   */
  async process(job: Job): Promise<any> {
    const { name, data } = job;
    this.logger.log(`⚙️ Procesando email job: ${name} (ID: ${job.id})`);

    if (name !== 'sendPasswordResetEmail') {
      this.logger.warn(`🟡 Job no soportado por PasswordResetProcessor: ${name}`);
      return { success: false, reason: 'Unsupported job type' };
    }

    try {
      await this.handleSendPasswordResetEmail(data.email, data.token, data.expiresAt);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`❌ Error al procesar job ${name}:`, error?.message || error);
      throw error;
    }
  }

  /**
   * Envía el email de recuperación de contraseña
   */
  private async handleSendPasswordResetEmail(email: string, token: string, expiresAt: string): Promise<void> {
    this.logger.log(`📧 Enviando email de recuperación de contraseña a: ${email}`);
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
      const htmlContent = `
        <h1>Recupera tu contraseña</h1>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#16a34a;color:white;border-radius:6px;text-decoration:none;font-weight:bold;">Restablecer contraseña</a>
        <p>Este enlace expirará el: <b>${new Date(expiresAt).toLocaleString()}</b></p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      `;
      await this.emailService.sendEmail(
        email,
        'Recupera tu contraseña',
        `Para restablecer tu contraseña, visita: ${resetUrl}. El enlace expirará el ${new Date(expiresAt).toLocaleString()}.`,
        htmlContent
      );
      this.logger.log(`✅ Email de recuperación enviado a ${email}`);
    } catch (error: any) {
      this.logger.error(`❌ Error al enviar email de recuperación a ${email}:`, error?.message || error);
      throw error;
    }
  }
}
