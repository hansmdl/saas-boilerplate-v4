import { z } from 'zod';

export const magicLinkRequestSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

export type MagicLinkRequestDto = z.infer<typeof magicLinkRequestSchema>;

export const magicLinkConsumeSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export type MagicLinkConsumeDto = z.infer<typeof magicLinkConsumeSchema>;
