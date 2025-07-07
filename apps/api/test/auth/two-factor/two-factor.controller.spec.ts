import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorController } from '../../../src/auth/two-factor/two-factor.controller';
import { TwoFactorService } from '../../../src/auth/two-factor/two-factor.service';

describe('TwoFactorController', () => {
  let controller: TwoFactorController;
  let service: TwoFactorService;

  const mockService = {
    generateTwoFactorSecret: jest.fn(),
    enableTwoFactor: jest.fn(),
    disableTwoFactor: jest.fn(),
    recoverTwoFactor: jest.fn(),
    sendEmailAuthCode: jest.fn(),
    verifyEmailAuthCode: jest.fn(),
  };

  const usuarioMock = { id: 'usuario-id', email: 'test@correo.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwoFactorController],
      providers: [
        { provide: TwoFactorService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<TwoFactorController>(TwoFactorController);
    service = module.get<TwoFactorService>(TwoFactorService);

    jest.clearAllMocks();
  });

  describe('generateTwoFactor', () => {
    it('debe generar un secreto 2FA para el usuario', async () => {
      const respuestaMock = { secret: 'secreto', otpAuthUrl: 'url', recoveryCode: 'recuperacion' };
      mockService.generateTwoFactorSecret.mockResolvedValue(respuestaMock);
      const resultado = await controller.generateTwoFactor(usuarioMock);
      expect(service.generateTwoFactorSecret).toHaveBeenCalledWith(usuarioMock.id);
      expect(resultado).toEqual(respuestaMock);
    });
  });

  describe('enableTwoFactor', () => {
    it('debe habilitar 2FA con el código correcto', async () => {
      const dto = { twoFactorCode: '123456' };
      const respuestaMock = { message: 'Autenticación de dos factores activada correctamente' };
      mockService.enableTwoFactor.mockResolvedValue(respuestaMock);
      const resultado = await controller.enableTwoFactor(usuarioMock, dto);
      expect(service.enableTwoFactor).toHaveBeenCalledWith(usuarioMock.id, dto.twoFactorCode);
      expect(resultado).toEqual(respuestaMock);
    });
  });

  describe('disableTwoFactor', () => {
    it('debe deshabilitar 2FA con el código correcto', async () => {
      const dto = { twoFactorCode: '654321' };
      const respuestaMock = { message: 'Autenticación de dos factores desactivada correctamente' };
      mockService.disableTwoFactor.mockResolvedValue(respuestaMock);
      // @ts-ignore
      const resultado = await controller.disableTwoFactor(usuarioMock, dto);
      expect(service.disableTwoFactor).toHaveBeenCalledWith(usuarioMock.id, dto.twoFactorCode);
      expect(resultado).toEqual(respuestaMock);
    });
  });

  describe('recoverTwoFactor', () => {
    it('debe recuperar acceso usando el código de recuperación', async () => {
      const dto = { recoveryCode: 'codigo-recuperacion' };
      const respuestaMock = { message: 'Acceso recuperado correctamente' };
      mockService.recoverTwoFactor.mockResolvedValue(respuestaMock);
      // @ts-ignore
      const resultado = await controller.recoverTwoFactor(usuarioMock, dto);
      expect(service.recoverTwoFactor).toHaveBeenCalledWith(usuarioMock.id, dto.recoveryCode);
      expect(resultado).toEqual(respuestaMock);
    });
  });

  describe('sendEmailCode', () => {
    it('debe enviar código de autenticación al correo', async () => {
      const dto = { email: 'correo@prueba.com' };
      const respuestaMock = { message: 'Código enviado al correo' };
      mockService.sendEmailAuthCode.mockResolvedValue(respuestaMock);
      const resultado = await controller.sendEmailCode(dto);
      expect(service.sendEmailAuthCode).toHaveBeenCalledWith(dto.email);
      expect(resultado).toEqual(respuestaMock);
    });
  });

  describe('verifyEmailCode', () => {
    it('debe verificar el código recibido por email', async () => {
      const dto = { email: 'correo@prueba.com', code: '111222' };
      const respuestaMock = { message: 'Código verificado correctamente' };
      mockService.verifyEmailAuthCode.mockResolvedValue(respuestaMock);
      const resultado = await controller.verifyEmailCode(dto);
      expect(service.verifyEmailAuthCode).toHaveBeenCalledWith(dto.email, dto.code);
      expect(resultado).toEqual(respuestaMock);
    });
  });
});
