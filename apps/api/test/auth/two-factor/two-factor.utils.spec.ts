import { TwoFactorUtils } from '../../../src/auth/two-factor/two-factor.utils';

describe('TwoFactorUtils', () => {
  describe('generateSecret', () => {
    it('debe generar un secreto hexadecimal de 40 caracteres', () => {
      const secreto = TwoFactorUtils.generateSecret();
      expect(typeof secreto).toBe('string');
      expect(secreto).toMatch(/^[a-f0-9]{40}$/);
    });
  });

  describe('generateRecoveryCode', () => {
    it('debe generar un código de recuperación hexadecimal de 40 caracteres', () => {
      const codigo = TwoFactorUtils.generateRecoveryCode();
      expect(typeof codigo).toBe('string');
      expect(codigo).toMatch(/^[a-f0-9]{40}$/);
    });
  });

  describe('generateVerificationCode', () => {
    it('debe generar un código numérico de 6 dígitos', () => {
      const codigo = TwoFactorUtils.generateVerificationCode();
      expect(typeof codigo).toBe('string');
      expect(codigo).toMatch(/^\d{6}$/);
    });
  });

  describe('generateQRCodeURL', () => {
    it('debe generar una URL otpauth válida', () => {
      const email = 'usuario@correo.com';
      const appName = 'MiApp';
      const secret = 'secreto123';
      const url = TwoFactorUtils.generateQRCodeURL(email, appName, secret);
      expect(url).toContain('otpauth://totp/');
      expect(url).toContain(encodeURIComponent(appName));
      expect(url).toContain(encodeURIComponent(email));
      expect(url).toContain(`secret=${secret}`);
      expect(url).toContain(`issuer=${encodeURIComponent(appName)}`);
    });
  });

  describe('verifyTOTP', () => {
    it('debe retornar true si el token y el almacenado son iguales', () => {
      expect(TwoFactorUtils.verifyTOTP('123456', '123456')).toBe(true);
    });
    it('debe retornar false si el token y el almacenado son diferentes', () => {
      expect(TwoFactorUtils.verifyTOTP('123456', '654321')).toBe(false);
    });
  });
});
// Resto del contenido idéntico al archivo anterior
