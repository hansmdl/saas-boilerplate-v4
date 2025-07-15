import { z } from "zod";

export const magicLinkRequestSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});
