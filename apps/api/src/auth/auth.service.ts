import {
  ConflictException,
  Injectable,
  UnauthorizedException,
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
      where: { email },
    });

    if (user && user.password) {
      const isValidPassword = await bcrypt.compare(pass, user.password);
      if (isValidPassword) {
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
    const { email, password } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    await this.sendVerificationEmail({ email: user.email });

    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

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
    const { email } = sendVerificationEmailDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerified) {
      return;
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await this.emailQueue.add('sendEmailVerificationEmail', { email, token });
  }

  async verifyEmail(token: string): Promise<void> {
    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { token },
      });

    if (!verificationToken || new Date() > verificationToken.expiresAt) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    await this.prisma.emailVerificationToken.delete({
      where: { token },
    });
  }
}
