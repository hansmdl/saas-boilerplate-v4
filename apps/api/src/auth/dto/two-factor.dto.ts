import { z } from 'zod';

export const enableTwoFactorSchema = z.object({
  twoFactorCode: z.string().min(6).max(6),
});

export type EnableTwoFactorDto = z.infer<typeof enableTwoFactorSchema>;

export const verifyTwoFactorSchema = z.object({
  twoFactorCode: z.string().min(6).max(6),
});

export type VerifyTwoFactorDto = z.infer<typeof verifyTwoFactorSchema>;

export const generateTwoFactorSchema = z.object({});

export type GenerateTwoFactorDto = z.infer<typeof generateTwoFactorSchema>;

export const disableTwoFactorSchema = z.object({
  twoFactorCode: z.string().min(6).max(6),
});

export type DisableTwoFactorDto = z.infer<typeof disableTwoFactorSchema>;

export const twoFactorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  twoFactorCode: z.string().min(6).max(6).optional(),
});

export type TwoFactorLoginDto = z.infer<typeof twoFactorLoginSchema>;

export const recoverTwoFactorSchema = z.object({
  recoveryCode: z.string().min(10),
});

export type RecoverTwoFactorDto = z.infer<typeof recoverTwoFactorSchema>;

// Schema para la autenticación 2FA por email
export const emailTwoFactorSchema = z.object({
  email: z.string().email(),
});

export type EmailTwoFactorDto = z.infer<typeof emailTwoFactorSchema>;

// Schema para verificar el código enviado por email
export const verifyEmailTwoFactorSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export type VerifyEmailTwoFactorDto = z.infer<typeof verifyEmailTwoFactorSchema>;
