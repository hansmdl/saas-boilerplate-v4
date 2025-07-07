import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { TwoFactorUtils } from './two-factor.utils';
import { PrismaService } from 'db';
import * as crypto from 'crypto';
import { EmailService } from 'email';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  /**
   * Genera un secreto TOTP para un usuario
   */
  async generateTwoFactorSecret(userId: string) {
    this.logger.log(`Generando secreto 2FA para usuario ${userId}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Generar un secreto único para este usuario
    const secret = TwoFactorUtils.generateSecret();
    
    // El nombre de la aplicación que aparece en las apps TOTP
    const appName = process.env.APP_NAME || 'SaaS Boilerplate';
    
    // Generar la URL para el código QR que se escanea con la app
    const otpAuthUrl = TwoFactorUtils.generateQRCodeURL(
      user.email,
      appName,
      secret
    );

    // En esta implementación simplificada, no generamos un QR real sino su URL
    const qrCodeDataUrl = otpAuthUrl;

    // También generamos un código de recuperación en caso de pérdida del dispositivo
    const recoveryCode = TwoFactorUtils.generateRecoveryCode();

    // Guardar el secreto en la base de datos (pero aún no activar 2FA)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorRecoveryCode: recoveryCode,
        twoFactorRecoveryCodeUsed: false,
      },
    });

    return {
      secret,
      otpAuthUrl,
      qrCodeDataUrl,
      recoveryCode,
    };
  }

  /**
   * Activa la autenticación de dos factores para un usuario
   */
  async enableTwoFactor(userId: string, code: string) {
    this.logger.log(`Activando 2FA para usuario ${userId}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, email: true },
    });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Debe generar un secreto primero');
    }

    // Verificar que el código proporcionado sea válido
    const isCodeValid = TwoFactorUtils.verifyTOTP(code, user.twoFactorSecret);

    if (!isCodeValid) {
      throw new UnauthorizedException('Código inválido');
    }

    // Activar 2FA para el usuario
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: true,
      },
    });

    // Notificar al usuario por email
    await this.emailQueue.add('securityNotification', {
      email: user.email,
      subject: 'Autenticación de dos factores activada',
      text: 'La autenticación de dos factores ha sido activada en tu cuenta.',
    });

    return { message: 'Autenticación de dos factores activada correctamente' };
  }

  /**
   * Desactiva la autenticación de dos factores para un usuario
   */
  async disableTwoFactor(userId: string, code: string) {
    this.logger.log(`Desactivando 2FA para usuario ${userId}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, isTwoFactorEnabled: true, email: true },
    });

    if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
      throw new UnauthorizedException('La autenticación de dos factores no está activada');
    }

    // Verificar que el código proporcionado sea válido
    const isCodeValid = TwoFactorUtils.verifyTOTP(code, user.twoFactorSecret);

    if (!isCodeValid) {
      throw new UnauthorizedException('Código inválido');
    }

    // Desactivar 2FA para el usuario
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCode: null,
        twoFactorRecoveryCodeUsed: false,
      },
    });

    // Notificar al usuario por email
    await this.emailQueue.add('securityNotification', {
      email: user.email,
      subject: 'Autenticación de dos factores desactivada',
      text: 'La autenticación de dos factores ha sido desactivada en tu cuenta.',
    });

    return { message: 'Autenticación de dos factores desactivada correctamente' };
  }

  /**
   * Verifica un código TOTP
   */
  verifyTOTP(code: string, secret: string): boolean {
    try {
      return TwoFactorUtils.verifyTOTP(code, secret);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al verificar código TOTP: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Recupera el acceso con un código de recuperación
   */
  async recoverTwoFactor(userId: string, recoveryCode: string) {
    this.logger.log(`Recuperando acceso 2FA para usuario ${userId}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorRecoveryCode: true, 
        twoFactorRecoveryCodeUsed: true,
        email: true 
      },
    });

    if (!user || !user.twoFactorRecoveryCode) {
      throw new UnauthorizedException('Código de recuperación inválido');
    }

    if (user.twoFactorRecoveryCodeUsed) {
      throw new UnauthorizedException('El código de recuperación ya ha sido utilizado');
    }

    if (user.twoFactorRecoveryCode !== recoveryCode) {
      throw new UnauthorizedException('Código de recuperación inválido');
    }

    // Generar un nuevo código de recuperación
    const newRecoveryCode = crypto.randomBytes(20).toString('hex');

    // Marcar el código actual como usado y establecer el nuevo
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorRecoveryCodeUsed: true,
        twoFactorRecoveryCode: newRecoveryCode,
      },
    });

    // Notificar al usuario por email
    await this.emailQueue.add('securityNotification', {
      email: user.email,
      subject: 'Código de recuperación de 2FA utilizado',
      text: 'Se ha utilizado tu código de recuperación de autenticación de dos factores.',
    });

    return { 
      message: 'Código de recuperación validado correctamente',
      newRecoveryCode 
    };
  }

  /**
   * Genera y envía un código de autenticación por email
   */
  async sendEmailAuthCode(email: string) {
    this.logger.log(`Enviando código de autenticación por email a ${email}`);
    
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // No revelar si el usuario existe o no
      this.logger.warn(`Intento de envío de código 2FA a un email inexistente: ${email}`);
      return { message: 'Si el email existe, se ha enviado un código de autenticación' };
    }

    // Generar un código de 6 dígitos
    const code = TwoFactorUtils.generateVerificationCode();
    
    // Guardar el código en la base de datos (con expiración)
    // Nota: Asumimos que tenemos una tabla para esto o usamos Redis
    // Para simplicidad, vamos a usar el campo twoFactorSecret temporalmente
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        // Almacenamos el código con su fecha de expiración
        twoFactorSecret: JSON.stringify({
          code,
          expiresAt: expiresAt.toISOString(),
          type: 'email',
        }),
      },
    });

    // Enviar el código por email
    await this.emailQueue.add('twoFactorCode', {
      email,
      code,
    });

    return { message: 'Código de autenticación enviado por email' };
  }

  /**
   * Verifica un código de autenticación enviado por email
   */
  async verifyEmailAuthCode(email: string, code: string) {
    this.logger.log(`Verificando código de autenticación por email para ${email}`);
    
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, twoFactorSecret: true },
    });

    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('Código inválido o expirado');
    }

    try {
      // Parseamos el JSON almacenado
      const storedData = JSON.parse(user.twoFactorSecret);
      
      // Verificamos que sea de tipo email
      if (storedData.type !== 'email') {
        throw new UnauthorizedException('Tipo de código inválido');
      }
      
      // Verificamos la expiración
      const expiresAt = new Date(storedData.expiresAt);
      if (new Date() > expiresAt) {
        throw new UnauthorizedException('Código expirado');
      }
      
      // Verificamos el código
      if (storedData.code !== code) {
        throw new UnauthorizedException('Código inválido');
      }
      
      // Limpiamos el código usado
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: null,
        },
      });
      
      return { 
        valid: true,
        userId: user.id 
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al verificar código por email: ${errorMessage}`);
      throw new UnauthorizedException('Código inválido o expirado');
    }
  }
}
