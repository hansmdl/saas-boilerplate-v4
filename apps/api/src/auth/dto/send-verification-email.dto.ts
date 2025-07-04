import { z } from 'zod';

export const sendVerificationEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type SendVerificationEmailDto = z.infer<typeof sendVerificationEmailSchema>;
