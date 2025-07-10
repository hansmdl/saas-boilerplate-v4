import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export const magicLinkRequestSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

export type MagicLinkRequestZodDto = z.infer<typeof magicLinkRequestSchema>;

export class MagicLinkRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}


export const magicLinkConsumeSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export type MagicLinkConsumeDto = z.infer<typeof magicLinkConsumeSchema>;
