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
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { MagicLinkService } from './magic-link.service';
import { MagicLinkRequestDto, magicLinkRequestSchema } from './dto/magic-link.dto';
import { ZodValidationPipe } from '../pipes/zod.pipe';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { registerSchema, RegisterDto } from './dto/register.dto';
import { loginSchema, LoginDto } from './dto/login.dto';
import { forgotPasswordSchema, ForgotPasswordDto } from './dto/forgot-password.dto';
import { resetPasswordSchema, ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from './decorators/user.decorator';
import type { User } from 'db';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly magicLinkService: MagicLinkService,
  ) {}

  @Post('magic-link-request')
  @ApiBody({ type: MagicLinkRequestDto })
  @UsePipes(new ZodValidationPipe(magicLinkRequestSchema))
  async requestMagicLink(@Body() dto: MagicLinkRequestDto) {
    // Usa FRONTEND_URL para armar el link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = await this.magicLinkService.createMagicLinkToken(dto, frontendUrl);
    // Aquí deberías enviar el email vía processor/email (no implementado aquí)
    // Por ahora solo retorna éxito (nunca revela si existe o no el email)
    return { message: 'Si el email existe, se ha enviado el enlace de acceso.' };
  }

  @Get('magic-link/:token')
  async consumeMagicLink(@Param('token') token: string, @Res({ passthrough: true }) res) {
    const user = await this.magicLinkService.consumeMagicLinkToken(token);
    // Autentica y retorna JWT igual que en login
    const { access_token, refresh_token } = await this.authService.login(user);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { access_token, refresh_token };
  }

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiBody({ type: LoginDto })
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

    return { access_token, refresh_token };
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

      // Determinar la URL base de redirección
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      // Construimos la URL al callback del frontend y enviamos el destino final como parámetro "target"
      const target = this.getRedirectUrl(state);
      const redirectUrl = `${frontendUrl.replace(/\/?$/, '')}/auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&target=${encodeURIComponent(target)}`;
      console.log(`🔄 Redirigiendo después de login con Google a: ${redirectUrl}`);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Error en Google OAuth callback:', error instanceof Error ? error.message : error);
      res.redirect(`/login?error=${encodeURIComponent('Error durante la autenticación con Google')}`);
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
  @ApiBody({ type: ForgotPasswordDto })
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'Password reset email sent' };
  }
  
  /**
   * Endpoint público para reenviar el correo de verificación
   * Permite a usuarios no autenticados solicitar un nuevo correo de verificación
   */
  @Post('resend-verification')
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema)) // Reutilizamos el schema que ya tiene email
  async resendVerificationEmail(@Body() { email }: ForgotPasswordDto) {
    try {
      const result = await this.authService.sendVerificationEmail({ email });
      return { 
        message: 'Si el email existe y no está verificado, se ha enviado un correo de verificación',
        success: true
      };
    } catch (error) {
      // Por seguridad, siempre devolvemos el mismo mensaje aunque el email no exista
      return { 
        message: 'Si el email existe y no está verificado, se ha enviado un correo de verificación',
        success: true
      };
    }
  }

  /**
   * Endpoint público para verificar el email mediante un token
   * @param token Token de verificación enviado al email del usuario
   * @returns Información sobre el resultado de la verificación
   */
  @Get('verify-email/:token')
  async verifyEmailToken(@Param('token') token: string) {
    try {
      const result = await this.authService.verifyEmail(token);
      return {
        message: 'Email verificado correctamente',
        email: result.email,
        verified: result.verified,
        success: true
      };
    } catch (error: unknown) {
      // Manejamos diferentes tipos de errores para dar feedback específico
      const err = error as any; // Casting seguro para acceder a propiedades
      if (err.response?.code === 'TOKEN_EXPIRED') {
        throw error; // Mantenemos el error original con su código
      } else if (err.response?.code === 'ALREADY_VERIFIED') {
        return {
          message: err.response.message || 'El email ya estaba verificado',
          email: err.response.email,
          verified: true,
          success: true
        };
      } else if (err.response?.code === 'INVALID_TOKEN') {
        throw error; // Mantenemos el error original con su código
      } else {
        throw error; // Para cualquier otro error, lo propagamos
      }
    }
  }

  /**
   * Endpoint autenticado para enviar un correo de verificación al usuario actual
   */
  @UseGuards(JwtAuthGuard)
  @Post('send-verification-email')
  async sendVerificationEmailToCurrentUser(@CurrentUser() user: Omit<User, 'password'>) {
    const result = await this.authService.sendVerificationEmail({ email: user.email });
    return {
      message: result.sent ? 'Correo de verificación enviado' : 'El email ya está verificado',
      email: user.email,
      sent: result.sent
    };
  }

  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password has been reset successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-verification-email')
  async sendVerificationEmail(@CurrentUser() user: Omit<User, 'password'>) {
    const result = await this.authService.sendVerificationEmail({ email: user.email });
    return { 
      message: result.sent 
        ? 'Correo de verificación enviado correctamente' 
        : 'El email ya está verificado, no se envió correo', 
      email: result.email,
      sent: result.sent
    };
  }

  /**
   * Verifica el email de un usuario utilizando el token enviado por correo
   * @param token Token de verificación único
   * @returns Información del usuario verificado y mensaje de éxito
   */
  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    const result = await this.authService.verifyEmail(token);
    return { 
      message: 'Email verificado correctamente', 
      email: result.email,
      verified: result.verified
    };
  }


}
