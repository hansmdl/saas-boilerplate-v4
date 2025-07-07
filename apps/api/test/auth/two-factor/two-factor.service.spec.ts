import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from './../../../src/auth/two-factor/two-factor.service';
import { PrismaService } from 'db';
import { Queue } from 'bullmq';
import { TwoFactorUtils } from './../../../src/auth/two-factor/two-factor.utils';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'email';

import { UserType, Role } from 'db';

interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string | null;
  emailVerified: boolean;
  twoFactorSecret: string | null;
  twoFactorRecoveryCode: string | null;
  twoFactorRecoveryCodeUsed: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  metadata: any;
  userType: UserType;
  organizationId: string | null;
  avatarUrl: string | null;
  roles: Role[];
}

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let prisma: PrismaService;
  let emailQueue: Queue;
  let configService: ConfigService;

  const mockUser: MockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    emailVerified: true,
    twoFactorSecret: null,
    twoFactorRecoveryCode: null,
    twoFactorRecoveryCodeUsed: false,
    isTwoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    metadata: null,
    userType: UserType.REGULAR,
    organizationId: null,
    avatarUrl: null,
    roles: [Role.USER],
  };

  beforeEach(async () => {
    // Mock para métodos estáticos de TwoFactorUtils
    jest.spyOn(TwoFactorUtils, 'generateSecret').mockReturnValue('MOCK_SECRET');
    jest.spyOn(TwoFactorUtils, 'generateRecoveryCode').mockReturnValue('MOCK_RECOVERY_CODE');
    jest.spyOn(TwoFactorUtils, 'generateVerificationCode').mockReturnValue('123456');
    jest.spyOn(TwoFactorUtils, 'generateQRCodeURL').mockImplementation((email, secret, appName) => 
      `https://example.com/qr?email=${email}&secret=${secret}&app=${appName}`
    );
    jest.spyOn(TwoFactorUtils, 'verifyTOTP').mockImplementation((code, secret) => 
      code === '123456' && secret === 'MOCK_SECRET'
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        {
          provide: EmailService,
          useValue: {
            send: jest.fn(),
            // Agrega aquí otros métodos mockeados si los necesita el servicio
          },
        },
        {
          provide: 'BullQueue_email',
          useValue: {
            add: jest.fn(),
            // agrega más métodos si tu servicio los usa
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
              update: jest.fn().mockResolvedValue({ ...mockUser, isTwoFactorEnabled: true }),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'TWO_FACTOR_AUTH_APP_NAME') return 'Test App';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    prisma = module.get<PrismaService>(PrismaService);
    emailQueue = module.get<Queue>('BullQueue_email');
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTwoFactorSecret', () => {
    it('should generate two-factor secret and recovery code', async () => {
      const result = await service.generateTwoFactorSecret('1');
      
      expect(result).toEqual({
        secret: 'MOCK_SECRET',
        otpAuthUrl: 'https://example.com/qr?email=test@example.com&secret=SaaS Boilerplate&app=MOCK_SECRET',
        qrCodeDataUrl: 'https://example.com/qr?email=test@example.com&secret=SaaS Boilerplate&app=MOCK_SECRET',
        recoveryCode: 'MOCK_RECOVERY_CODE',
      });
      expect(TwoFactorUtils.generateSecret).toHaveBeenCalled();
      expect(TwoFactorUtils.generateRecoveryCode).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { 
          twoFactorSecret: 'MOCK_SECRET',
          twoFactorRecoveryCode: 'MOCK_RECOVERY_CODE',
          twoFactorRecoveryCodeUsed: false,
        },
      });
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
      
      await expect(service.generateTwoFactorSecret('1')).rejects.toThrow(
        'Usuario no encontrado'
      );
    });
  });

  describe('enableTwoFactor', () => {
    it('should enable two-factor authentication', async () => {
      // Mock usuario con twoFactorSecret válido
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        ...mockUser,
        twoFactorSecret: 'MOCK_SECRET',
      });
      jest.spyOn(TwoFactorUtils, 'verifyTOTP').mockReturnValueOnce(true);
      const result = await service.enableTwoFactor('1', '123456');
      
      expect(result).toEqual({ message: 'Autenticación de dos factores activada correctamente' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isTwoFactorEnabled: true },
      });
      expect(emailQueue.add).toHaveBeenCalledTimes(1);
      expect(emailQueue.add).toHaveBeenCalledWith(
        'securityNotification',
        expect.objectContaining({
          email: 'test@example.com',
          subject: 'Autenticación de dos factores activada',
          text: 'La autenticación de dos factores ha sido activada en tu cuenta.',
        })
      );
    });
  });

  describe('verifyTOTP', () => {
    it('should verify valid TOTP code', async () => {
      // Mock usuario con twoFactorSecret válido
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        ...mockUser,
        twoFactorSecret: 'MOCK_SECRET',
      });
      jest.spyOn(TwoFactorUtils, 'verifyTOTP').mockReturnValueOnce(true);
      const result = await service.verifyTOTP('1', '123456');
      
      expect(result).toBe(true);
      expect(TwoFactorUtils.verifyTOTP).toHaveBeenCalledWith(
        '1',
        '123456'
      );
    });

    it('should return false for invalid TOTP code', async () => {
      jest.spyOn(TwoFactorUtils, 'verifyTOTP').mockImplementationOnce(() => false);
      
      const result = await service.verifyTOTP('1', 'wrong-code');
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
      
      const result = await service.verifyTOTP('1', '123456');
      expect(result).toBe(false);
    });
  });

  describe('disableTwoFactor', () => {
    it('should disable two-factor authentication', async () => {
      // Mock usuario con 2FA activado y secret válido
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        ...mockUser,
        twoFactorSecret: 'MOCK_SECRET',
        isTwoFactorEnabled: true,
      });
      jest.spyOn(TwoFactorUtils, 'verifyTOTP').mockReturnValueOnce(true);
      const result = await service.disableTwoFactor('1', '123456');
      
      expect(result).toEqual({ message: 'Autenticación de dos factores desactivada correctamente' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          isTwoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorRecoveryCode: null,
        }),
      });
      expect(emailQueue.add).toHaveBeenCalledTimes(1);
      expect(emailQueue.add).toHaveBeenCalledWith(
        'securityNotification',
        expect.objectContaining({
          email: 'test@example.com',
          subject: 'Autenticación de dos factores desactivada',
          text: 'La autenticación de dos factores ha sido desactivada en tu cuenta.',
        })
      );
    });
  });

  describe('recoverTwoFactor', () => {
    it('should recover account using valid recovery code', async () => {
      const userWith2FA = {
        ...mockUser,
        isTwoFactorEnabled: true,
        twoFactorRecoveryCode: 'VALID_RECOVERY_CODE',
        twoFactorRecoveryCodeUsed: false,
      };
      
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(userWith2FA);
      
      const result = await service.recoverTwoFactor('1', 'VALID_RECOVERY_CODE');
      
      expect(result).toHaveProperty('message', 'Código de recuperación validado correctamente');
      expect(result).toHaveProperty('newRecoveryCode');
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({
          twoFactorRecoveryCodeUsed: true,
        }),
      }));
    });

    it('should reject invalid recovery code', async () => {
      const userWith2FA = {
        ...mockUser,
        isTwoFactorEnabled: true,
        twoFactorRecoveryCode: 'VALID_RECOVERY_CODE',
        twoFactorRecoveryCodeUsed: false,
      };
      
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(userWith2FA);
      
      await expect(service.recoverTwoFactor('1', 'INVALID_CODE')).rejects.toThrow(
        'Código de recuperación inválido'
      );
    });

    it('should reject already used recovery code', async () => {
      const userWith2FA = {
        ...mockUser,
        isTwoFactorEnabled: true,
        twoFactorRecoveryCode: 'VALID_RECOVERY_CODE',
        twoFactorRecoveryCodeUsed: true,
      };
      
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(userWith2FA);
      
      await expect(service.recoverTwoFactor('1', 'VALID_RECOVERY_CODE')).rejects.toThrow(
        'El código de recuperación ya ha sido utilizado'
      );
    });
  });
});
