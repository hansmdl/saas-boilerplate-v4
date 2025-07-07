import * as crypto from 'crypto';

/**
 * Utilidades para autenticación de dos factores que no dependen de bibliotecas externas
 */
export class TwoFactorUtils {
  /**
   * Genera un secreto para autenticación de dos factores
   */
  static generateSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Genera un código de recuperación
   */
  static generateRecoveryCode(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Genera un código de verificación de 6 dígitos
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Genera una URL para el código QR
   * Esta es una implementación simplificada, en producción usar una biblioteca como 'qrcode'
   */
  static generateQRCodeURL(email: string, appName: string, secret: string): string {
    const encodedAppName = encodeURIComponent(appName);
    const encodedEmail = encodeURIComponent(email);
    // Formato otpauth://totp/{appName}:{email}?secret={secret}&issuer={appName}
    return `otpauth://totp/${encodedAppName}:${encodedEmail}?secret=${secret}&issuer=${encodedAppName}`;
  }

  /**
   * Verifica un código TOTP
   * Esta es una implementación simplificada que compara el código con el almacenado
   */
  static verifyTOTP(token: string, storedToken: string): boolean {
    return token === storedToken;
  }
}
