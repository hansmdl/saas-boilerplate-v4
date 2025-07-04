import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'email';
import { PrismaService } from 'db';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserType } from '../../../../packages/db/src/generated/prisma';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let emailQueue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            passwordResetToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            emailVerificationToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: getQueueToken('email'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    emailQueue = module.get<Queue>(getQueueToken('email'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if password is valid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        userType: UserType.REGULAR,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.validateUser('nonexistent@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        userType: UserType.REGULAR,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        userType: 'REGULAR' as any,
        isTwoFactorAuthenticationEnabled: false,
        twoFactorAuthenticationSecret: null,
        metadata: {},
      };
      (jwtService.sign as jest.Mock).mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');

      const result = await service.login(user);
      expect(result).toEqual({ access_token: 'access_token', refresh_token: 'refresh_token' });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('register', () => {
    it('should register a new user and send verification email', async () => {
      const registerDto = { email: 'newuser@example.com', password: 'password123' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      const mockUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        password: 'hashedPassword',
        userType: UserType.REGULAR,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(service, 'sendVerificationEmail').mockResolvedValue(undefined);

      const result = await service.register(registerDto);
      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: registerDto.email, password: 'hashedPassword' },
      });
      expect(service.sendVerificationEmail).toHaveBeenCalledWith({ email: registerDto.email });
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = { email: 'existing@example.com', password: 'password123' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user-id' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email if user exists', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-id', email: 'test@example.com' });
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({});
      (emailQueue.add as jest.Mock).mockResolvedValue({});

      await service.forgotPassword(forgotPasswordDto);
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalledWith('sendPasswordResetEmail', {
        email: forgotPasswordDto.email,
        token: 'mock-uuid',
      });
    });

    it('should not throw error if user does not exist', async () => {
      const forgotPasswordDto = { email: 'nonexistent@example.com' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.forgotPassword(forgotPasswordDto)).resolves.toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('should reset password and delete token', async () => {
      const resetPasswordDto = { token: 'valid-token', password: 'newPassword123' };
      const mockResetToken = {
        token: 'valid-token',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      };
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(mockResetToken);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.passwordResetToken.delete as jest.Mock).mockResolvedValue({});

      await service.resetPassword(resetPasswordDto);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { password: 'newHashedPassword' },
      });
      expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { token: 'valid-token' } });
    });

    it('should throw UnauthorizedException for invalid or expired token', async () => {
      const resetPasswordDto = { token: 'invalid-token', password: 'newPassword123' };
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(UnauthorizedException);

      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        expiresAt: new Date(Date.now() - 1000),
      }); // Expired token
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email if user exists and email is not verified', async () => {
      const sendVerificationEmailDto = { email: 'test@example.com' };
      const mockUser = { id: 'user-id', email: 'test@example.com', emailVerified: false };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({});
      (emailQueue.add as jest.Mock).mockResolvedValue({});

      await service.sendVerificationEmail(sendVerificationEmailDto);
      expect(prisma.emailVerificationToken.create).toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalledWith('sendEmailVerificationEmail', {
        email: sendVerificationEmailDto.email,
        token: 'mock-uuid',
      });
    });

    it('should not send email if user does not exist or email is already verified', async () => {
      const sendVerificationEmailDto = { email: 'nonexistent@example.com' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.sendVerificationEmail(sendVerificationEmailDto)).resolves.toBeUndefined();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ emailVerified: true });
      await expect(service.sendVerificationEmail(sendVerificationEmailDto)).resolves.toBeUndefined();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and delete token', async () => {
      const token = 'valid-token';
      const mockVerificationToken = {
        token: 'valid-token',
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      };
      (prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(mockVerificationToken);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.emailVerificationToken.delete as jest.Mock).mockResolvedValue({});

      await service.verifyEmail(token);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { emailVerified: true },
      });
      expect(prisma.emailVerificationToken.delete).toHaveBeenCalledWith({ where: { token } });
    });

    it('should throw UnauthorizedException for invalid or expired token', async () => {
      const token = 'invalid-token';
      (prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.verifyEmail(token)).rejects.toThrow(UnauthorizedException);

      (prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue({
        expiresAt: new Date(Date.now() - 1000),
      }); // Expired token
      await expect(service.verifyEmail(token)).rejects.toThrow(UnauthorizedException);
    });
  });
});
