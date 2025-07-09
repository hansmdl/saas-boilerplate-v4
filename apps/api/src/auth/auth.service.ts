import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import type { User } from 'db';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomBytes } from 'crypto';
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
@InjectQueue('password-reset') private passwordResetQueue: Queue,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      // No revelamos si el usuario existe o no por seguridad
      return null;
    }

    if (!user.password) {
      // Usuario registrado con autenticación social
      throw new UnauthorizedException('Esta cuenta fue registrada con autenticación social. Por favor inicia sesión con ese método.');
    }

    const isValidPassword = await bcrypt.compare(pass, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Verificar si el email está verificado
    if (!user.emailVerified) {
      // Generamos un nuevo token de verificación para facilitar al usuario
      await this.sendVerificationEmail({ email: user.email });
      throw new UnauthorizedException({
        message: 'Email no verificado. Se ha enviado un nuevo correo de verificación.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    return user;
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

    try {
      console.log(`🔍 Adding password reset job to queue for: ${email} (expires: ${expiresAt.toISOString()})`);
      const job = await this.passwordResetQueue.add('sendPasswordResetEmail', { email, token, expiresAt });
      console.log(`✅ Password reset job queued successfully with ID: ${job.id}`);
    } catch (error) {
      console.error(`❌ Error queueing password reset email for ${email}:`, error instanceof Error ? error.message : error);
      throw error;
    }
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

  /**
   * Envía un correo de verificación al usuario
   * @param dto Objeto con el email del usuario
   * @returns Información sobre el resultado del envío
   * @throws NotFoundException si el usuario no existe
   * @throws BadRequestException si el email ya está verificado
   */
  async sendVerificationEmail(dto: { email: string }): Promise<{ email: string; sent: boolean }> {
    const { email } = dto;

    try {
      console.log(`📧 Sending verification email to ${email}...`);

      // Buscar usuario
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        console.log(`❌ User with email ${email} not found`);
        throw new NotFoundException({
          message: `Usuario con email ${email} no encontrado`,
          code: 'USER_NOT_FOUND'
        });
      }

      // Verificar si ya está verificado
      if (user.emailVerified) {
        console.log(`⚠️ Email ${email} is already verified`);
        return { 
          email, 
          sent: false 
        };
      }

      // Eliminar tokens anteriores para este usuario
      await this.prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id }
      });
      console.log(`🗑️ Deleted previous verification tokens for user ${user.id}`);

      // Generar nuevo token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Token válido por 24 horas

      // Guardar token
      await this.prisma.emailVerificationToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // Construir URL de verificación
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${frontendUrl}/verify-email/${token}`;

      console.log(`🔗 Verification URL: ${verificationUrl}`);

      // Añadir a la cola de email
      await this.emailQueue.add('verification-email', {
        to: email,
        name: user.name || 'Usuario',
        verificationUrl,
      });

      console.log(`✅ Verification email queued for ${email}`);
      
      return { 
        email, 
        sent: true 
      };
    } catch (error) {
      console.error(`❌ Error sending verification email:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  /**
   * Verifica el email de un usuario utilizando el token enviado por correo
   * @param token Token de verificación único
   * @returns Información del usuario verificado
   * @throws UnauthorizedException si el token es inválido o ha expirado
   * @throws BadRequestException si el email ya fue verificado previamente
   */
  async verifyEmail(token: string): Promise<{email: string; verified: boolean}> {
    console.log(`🔍 Verifying email with token: ${token.substring(0, 8)}...`);

    try {
      // Validar que el token exista
      console.log(`🔍 Searching for verification token in database...`);
      const verificationToken = await this.prisma.emailVerificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        console.log(`❌ Verification failed: Token not found in database`);
        throw new UnauthorizedException({
          message: 'Token de verificación inválido o expirado.',
          code: 'INVALID_TOKEN'
        });
      }
      console.log(`✅ Token found, user ID: ${verificationToken.userId}, expires: ${verificationToken.expiresAt}`);

      // Validar que el token no haya expirado
      if (new Date() > verificationToken.expiresAt) {
        console.log(`❌ Verification failed: Token expired at ${verificationToken.expiresAt}`);
        // Eliminar token expirado por seguridad
        await this.prisma.emailVerificationToken.delete({ where: { token } });
        throw new UnauthorizedException({
          message: 'Token de verificación expirado. Solicita uno nuevo.',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Buscar al usuario asociado al token
      console.log(`🔍 Finding user with ID: ${verificationToken.userId}`);
      const user = await this.prisma.user.findUnique({ 
        where: { id: verificationToken.userId } 
      });
      
      if (!user) {
        console.log(`❌ Verification failed: User not found for token`);
        await this.prisma.emailVerificationToken.delete({ where: { token } });
        throw new UnauthorizedException({
          message: 'Usuario no encontrado.',
          code: 'USER_NOT_FOUND'
        });
      }
      console.log(`✅ User found: ${user.email}`);

      // Verificar si el email ya estaba verificado
      if (user.emailVerified) {
        console.log(`⚠️ Email already verified for user: ${user.email}`);
        // Eliminar token redundante
        await this.prisma.emailVerificationToken.delete({ where: { token } });
        throw new BadRequestException({
          message: 'El email ya fue verificado previamente.',
          code: 'ALREADY_VERIFIED'
        });
      }

      // Actualizar usuario y eliminar token en una transacción
      console.log(`🔍 Updating user ${user.email} to verified status...`);
      const result = await this.prisma.$transaction(async (tx) => {
        // Marcar email como verificado
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
        
        // Eliminar token usado
        await tx.emailVerificationToken.delete({ where: { token } });
        
        // Eliminar cualquier otro token de verificación para este usuario
        await tx.emailVerificationToken.deleteMany({
          where: { userId: user.id }
        });
        
        return updatedUser;
      });
      
      console.log(`✅ User ${user.email} verified successfully`);
      console.log(`✅ All verification tokens for user deleted from database`);
      
      // Retornar información útil para el frontend
      return {
        email: result.email,
        verified: result.emailVerified
      };
    } catch (error) {
      console.error(`❌ Email verification error:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async socialLogin(user: { email: string; name: string }) {
    console.log(`🔍 Social login attempt for: ${user.email}`);
    // Find or create user
    let dbUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      console.log(`🔍 Creating new user for social login: ${user.email}`);
      dbUser = await this.prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          emailVerified: true, // Social logins are pre-verified
        },
      });
      console.log(`✅ New user created with ID: ${dbUser.id} for social login`);
    } else {
      console.log(`✅ Existing user found for social login: ${user.email}`);
      // Update the name if it's different
      if (user.name && (!dbUser.name || dbUser.name !== user.name)) {
        console.log(`🔄 Updating user name for ${user.email} to: ${user.name}`);
        await this.prisma.user.update({
          where: { id: dbUser.id },
          data: { name: user.name },
        });
      }
    }

    // Generate tokens
    const payload = { email: dbUser.email, sub: dbUser.id };
    console.log(`🔑 Generating tokens for user: ${dbUser.email}`);
    
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET, // Corregido: usar refresh secret
      expiresIn: '7d',
    });

    console.log(`✅ Tokens generated successfully for social login: ${dbUser.email}`);
    return { accessToken, refreshToken };
  }
}
