import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { Response } from 'express';
import { ZodValidationPipe } from '../../src/pipes/zod.pipe';
import { registerSchema, type RegisterDto } from '../../src/auth/dto/register.dto';
import { loginSchema, type LoginDto } from '../../src/auth/dto/login.dto';
import { forgotPasswordSchema, type ForgotPasswordDto } from '../../src/auth/dto/forgot-password.dto';
import { resetPasswordSchema, type ResetPasswordDto } from '../../src/auth/dto/reset-password.dto';
import { sendVerificationEmailSchema, type SendVerificationEmailDto } from '../../src/auth/dto/send-verification-email.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            sendVerificationEmail: jest.fn(),
            verifyEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user', async () => {
      const registerDto = { email: 'test@example.com', password: 'password123' };
      jest.spyOn(authService, 'register').mockResolvedValue({ id: 'user-id', email: 'test@example.com' } as any);

      const result = await controller.register(registerDto);
      expect(result).toEqual({ id: 'user-id', email: 'test@example.com' });
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should log in a user and set refresh token cookie', async () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      const tokens = { access_token: 'access', refresh_token: 'refresh' };
      jest.spyOn(authService, 'login').mockResolvedValue(tokens);

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.login({ user } as any, mockResponse);
      expect(result).toEqual({ access_token: 'access' });
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refresh_token', 'refresh', expect.any(Object));
    });
  });

  describe('me', () => {
    it('should return the current user', async () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      const result = await controller.me(user as any);
      expect(result).toEqual(user);
    });
  });

  describe('forgotPassword', () => {
    it('should send a password reset email', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      jest.spyOn(authService, 'forgotPassword').mockResolvedValue(undefined);

      const result = await controller.forgotPassword(forgotPasswordDto);
      expect(result).toEqual({ message: 'Password reset email sent' });
      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });
  });

  describe('resetPassword', () => {
    it('should reset the password', async () => {
      const resetPasswordDto = { token: 'token', password: 'newPassword' };
      jest.spyOn(authService, 'resetPassword').mockResolvedValue(undefined);

      const result = await controller.resetPassword(resetPasswordDto);
      expect(result).toEqual({ message: 'Password has been reset successfully' });
      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email', async () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      jest.spyOn(authService, 'sendVerificationEmail').mockResolvedValue(undefined);

      const result = await controller.sendVerificationEmail(user as any);
      expect(result).toEqual({ message: 'Verification email sent' });
      expect(authService.sendVerificationEmail).toHaveBeenCalledWith({ email: user.email });
    });
  });

  describe('verifyEmail', () => {
    it('should verify the email', async () => {
      const token = 'verification-token';
      jest.spyOn(authService, 'verifyEmail').mockResolvedValue(undefined);

      const result = await controller.verifyEmail(token);
      expect(result).toEqual({ message: 'Email verified successfully' });
      expect(authService.verifyEmail).toHaveBeenCalledWith(token);
    });
  });
});
