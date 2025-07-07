import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
  UsePipes,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ZodValidationPipe } from '../pipes/zod.pipe';
import { registerSchema, type RegisterDto } from './dto/register.dto';
import { loginSchema } from './dto/login.dto';
import { forgotPasswordSchema, type ForgotPasswordDto } from './dto/forgot-password.dto';
import { resetPasswordSchema, type ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from './decorators/user.decorator';
import type { User } from 'db';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Request() req: { user: Omit<User, 'password'> },
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.login(
      req.user,
    );

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { access_token };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req, @Res() res: Response, @Query('state') state?: string) {
    try {
      // Handle Google OAuth callback
      const { accessToken, refreshToken } = await this.authService.socialLogin(req.user);
      this.setCookies(res, accessToken, refreshToken);
      
      // Determinar la URL de redirección
      const redirectUrl = this.getRedirectUrl(state);
      console.log(`🔄 Redirigiendo después de login con Google a: ${redirectUrl}`);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Error en Google OAuth callback:', error instanceof Error ? error.message : error);
      res.redirect(`/login?error=${encodeURIComponent('Error durante la autenticación con Google')}`);
    }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates the GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Request() req, @Res() res: Response, @Query('state') state?: string) {
    try {
      // Handle GitHub OAuth callback
      const { accessToken, refreshToken } = await this.authService.socialLogin(req.user);
      this.setCookies(res, accessToken, refreshToken);
      
      // Determinar la URL de redirección
      const redirectUrl = this.getRedirectUrl(state);
      console.log(`🔄 Redirigiendo después de login con GitHub a: ${redirectUrl}`);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Error en GitHub OAuth callback:', error instanceof Error ? error.message : error);
      res.redirect(`/login?error=${encodeURIComponent('Error durante la autenticación con GitHub')}`);
    }
  }

  /**
   * Establece las cookies de autenticación en la respuesta
   */
  private setCookies(res: Response, accessToken: string, refreshToken: string): void {
    // Configurar cookie para el token de acceso
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    // Configurar cookie para el token de refresco
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
  }

  /**
   * Determina la URL de redirección después del login social
   */
  private getRedirectUrl(state?: string): string {
    // Si hay un estado y es una URL válida, usar esa URL
    if (state) {
      try {
        // Intentar decodificar el estado (puede estar en base64 o URL encoded)
        let decodedState: string;
        try {
          decodedState = Buffer.from(state, 'base64').toString('utf-8');
        } catch (e) {
          decodedState = decodeURIComponent(state);
        }
        
        // Validar que sea una URL interna válida
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        // Asegurarse que la URL de redirección sea relativa o del mismo dominio
        if (decodedState.startsWith('/') || decodedState.startsWith(frontendUrl)) {
          return decodedState;
        }
      } catch (error) {
        console.warn(`Estado inválido en callback OAuth: ${state}`);
      }
    }
    
    // URL predeterminada si no hay estado válido
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: Omit<User, 'password'>) {
    return user;
  }

  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'Password reset email sent' };
  }

  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password has been reset successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-verification-email')
  async sendVerificationEmail(@CurrentUser() user: Omit<User, 'password'>) {
    await this.authService.sendVerificationEmail({ email: user.email });
    return { message: 'Verification email sent' };
  }

  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }


}
