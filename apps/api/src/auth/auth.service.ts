import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { User } from 'db';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { EmailService } from 'email';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import type { RegisterDto } from './dto/register.dto.js';
import type { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';
import type { SendVerificationEmailDto } from './dto/send-verification-email.dto.js';

import { PrismaService } from 'db';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (user && user.password) {
      const isValidPassword = await bcrypt.compare(pass, user.password);
      if (isValidPassword) {
        if (!user.emailVerified) {
          throw new UnauthorizedException('Email no verificado. Por favor revisa tu correo para activar tu cuenta.');
        }
        return user;
      }
    }
    return null;
  }

  async login(user: Omit<User, 'password'>) {
    const payload = { email: user.email, sub: user.id };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    console.log(`🔍 Registration attempt for: ${registerDto.email}`);
    const { email, password } = registerDto;

    try {
      // Check if user exists
      console.log(`🔍 Checking if user ${email} already exists...`);
      const existingUser = await this.prisma.user.findUnique({
        where: { email: email },
      });

      if (existingUser) {
        console.log(`⚠️ Registration failed: User ${email} already exists`);
        throw new ConflictException('User with this email already exists');
      }

      // Hash password and create user
      console.log(`🔍 Creating new user for ${email}...`);
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });
      console.log(`✅ User created successfully with ID: ${user.id}`);

      // Send verification email
      console.log(`🔍 Initiating email verification process for ${email}...`);
      await this.sendVerificationEmail({ email: user.email });

      return user;
    } catch (error) {
      console.error(`❌ Registration error for ${email}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email: email } });

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await this.emailQueue.add('sendPasswordResetEmail', { email, token });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, password } = resetPasswordDto;

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || new Date() > resetToken.expiresAt) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user) {
      // This should not happen if the token is valid
      throw new UnauthorizedException('Invalid token');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.prisma.passwordResetToken.delete({
      where: { token },
    });
  }

  async sendVerificationEmail(
    sendVerificationEmailDto: SendVerificationEmailDto,
  ): Promise<void> {
    console.log(`🔍 Processing verification email request for: ${sendVerificationEmailDto.email}`);
    const { email } = sendVerificationEmailDto;

    try {
      // Find user
      console.log(`🔍 Finding user for email verification: ${email}`);
      const user = await this.prisma.user.findUnique({ where: { email: email } });

      if (!user) {
        console.log(`⚠️ Email verification skipped: User ${email} not found`);
        return;
      }
      
      if (user.emailVerified) {
        console.log(`⚠️ Email verification skipped: User ${email} already verified`);
        return;
      }

      // Create verification token
      console.log(`🔍 Creating email verification token for user ID: ${user.id}`);
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });
      console.log(`✅ Verification token created: ${token.substring(0, 8)}... (expires ${expiresAt})`);

      // Queue email job
      console.log(`🔍 Adding verification email to queue for: ${email}`);
      const job = await this.emailQueue.add('sendEmailVerificationEmail', { email, token });
      console.log(`✅ Email job queued successfully with ID: ${job.id}`);
    } catch (error) {
      console.error(`❌ Error sending verification email for ${email}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    console.log(`🔍 Verifying email with token: ${token.substring(0, 8)}...`);

    try {
      // Find token
      console.log(`🔍 Searching for verification token in database...`);
      const verificationToken = await this.prisma.emailVerificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        console.log(`❌ Verification failed: Token not found in database`);
        throw new UnauthorizedException('Token de verificación inválido o expirado.');
      }
      console.log(`✅ Token found, user ID: ${verificationToken.userId}, expires: ${verificationToken.expiresAt}`);

      // Check token expiration
      if (new Date() > verificationToken.expiresAt) {
        console.log(`❌ Verification failed: Token expired at ${verificationToken.expiresAt}`);
        await this.prisma.emailVerificationToken.delete({ where: { token } });
        throw new UnauthorizedException('Token de verificación expirado. Solicita uno nuevo.');
      }

      // Find user
      console.log(`🔍 Finding user with ID: ${verificationToken.userId}`);
      const user = await this.prisma.user.findUnique({ where: { id: verificationToken.userId } });
      if (!user) {
        console.log(`❌ Verification failed: User not found for token`);
        await this.prisma.emailVerificationToken.delete({ where: { token } });
        throw new UnauthorizedException('Usuario no encontrado.');
      }
      console.log(`✅ User found: ${user.email}`);

      // Check if already verified
      if (user.emailVerified) {
        console.log(`⚠️ Email already verified for user: ${user.email}`);
        await this.prisma.emailVerificationToken.delete({ where: { token } });
        throw new BadRequestException('El email ya fue verificado previamente.');
      }

      // Update user and delete token
      console.log(`🔍 Updating user ${user.email} to verified status...`);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      console.log(`✅ User ${user.email} verified successfully`);

      await this.prisma.emailVerificationToken.delete({ where: { token } });
      console.log(`✅ Verification token deleted from database`);
    } catch (error) {
      console.error(`❌ Email verification error:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async socialLogin(user: { email: string; name: string }) {
    // Find or create user
    let dbUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          emailVerified: true,
        },
      });
    }

    // Generate tokens
    const payload = { email: dbUser.email, sub: dbUser.id };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
