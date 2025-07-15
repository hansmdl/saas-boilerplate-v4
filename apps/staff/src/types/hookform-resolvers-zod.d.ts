declare module '@hookform/resolvers/zod' {
  import { ZodSchema, z } from 'zod';
  import { Resolver } from 'react-hook-form';

  /**
   * Minimal ambient typing to satisfy TS when package export maps fail.
   * Falls back to `any` on parse type if generic inference is tricky.
   */
  export function zodResolver<T extends ZodSchema<any>>(
    schema: T,
    schemaOptions?: Parameters<typeof z.any>[0],
    resolverOptions?: {
      mode?: 'sync' | 'async';
      raw?: boolean;
    }
  ): Resolver<ReturnType<T['parse']>>;
}
