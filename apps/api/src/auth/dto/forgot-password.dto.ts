import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordZodDto = z.infer<typeof forgotPasswordSchema>;

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}
