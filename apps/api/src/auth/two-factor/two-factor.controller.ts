import { 
  Body, 
  Controller, 
  Get, 
  Post, 
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../pipes/zod.pipe';
import { 
  EnableTwoFactorDto, 
  DisableTwoFactorDto,
  RecoverTwoFactorDto,
  enableTwoFactorSchema,
  disableTwoFactorSchema,
  recoverTwoFactorSchema,
  EmailTwoFactorDto,
  VerifyEmailTwoFactorDto,
  emailTwoFactorSchema,
  verifyEmailTwoFactorSchema
} from '../dto/two-factor.dto';

@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @UseGuards(JwtAuthGuard)
  @Get('generate')
  async generateTwoFactor(@CurrentUser() user: any) {
    return await this.twoFactorService.generateTwoFactorSecret(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('enable')
  @UsePipes(new ZodValidationPipe(enableTwoFactorSchema))
  async enableTwoFactor(
    @CurrentUser() user: any,
    @Body() enableTwoFactorDto: EnableTwoFactorDto,
  ) {
    return await this.twoFactorService.enableTwoFactor(
      user.id,
      enableTwoFactorDto.twoFactorCode,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('disable')
  @UsePipes(new ZodValidationPipe(disableTwoFactorSchema))
  async disableTwoFactor(
    @CurrentUser() user: any,
    @Body() disableTwoFactorDto: DisableTwoFactorDto,
  ) {
    return await this.twoFactorService.disableTwoFactor(
      user.id,
      disableTwoFactorDto.twoFactorCode,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('recover')
  @UsePipes(new ZodValidationPipe(recoverTwoFactorSchema))
  async recoverTwoFactor(
    @CurrentUser() user: any,
    @Body() recoverTwoFactorDto: RecoverTwoFactorDto,
  ) {
    return await this.twoFactorService.recoverTwoFactor(
      user.id,
      recoverTwoFactorDto.recoveryCode,
    );
  }

  /**
   * Endpoints para autenticación 2FA por email
   */
  @Post('email/send')
  @UsePipes(new ZodValidationPipe(emailTwoFactorSchema))
  async sendEmailCode(@Body() emailTwoFactorDto: EmailTwoFactorDto) {
    return await this.twoFactorService.sendEmailAuthCode(emailTwoFactorDto.email);
  }

  @Post('email/verify')
  @UsePipes(new ZodValidationPipe(verifyEmailTwoFactorSchema))
  async verifyEmailCode(@Body() verifyEmailTwoFactorDto: VerifyEmailTwoFactorDto) {
    return await this.twoFactorService.verifyEmailAuthCode(
      verifyEmailTwoFactorDto.email,
      verifyEmailTwoFactorDto.code,
    );
  }
}
