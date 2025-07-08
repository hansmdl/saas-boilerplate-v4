import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'db';
import { randomUUID } from 'crypto';
import { addMinutes } from 'date-fns';
import { MagicLinkRequestDto } from './dto/magic-link.dto';

@Injectable()
export class MagicLinkService {
  constructor(private readonly prisma: PrismaService) {}
  
  /**
   * Acceso seguro al modelo magicLinkToken usando any como solución temporal
   * hasta que se resuelvan los problemas de generación de tipos
   */
  private get magicLinkToken() {
    return (this.prisma as any).magicLinkToken;
  }

  async createMagicLinkToken(dto: MagicLinkRequestDto, frontendUrl: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return '';
    }
    const token = randomUUID();
    const expiresAt = addMinutes(new Date(), 15);
    await this.magicLinkToken.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });
    return `${frontendUrl}/magic-link/${token}`;
  }

  async consumeMagicLinkToken(token: string) {
    const magicToken = await this.magicLinkToken.findUnique({ where: { token } });
    if (!magicToken || magicToken.consumed || new Date() > magicToken.expiresAt) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    await this.magicLinkToken.update({
      where: { token },
      data: { consumed: true },
    });
    const user = await this.prisma.user.findUnique({ where: { id: magicToken.userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
