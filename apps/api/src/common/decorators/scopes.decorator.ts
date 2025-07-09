import { SetMetadata } from '@nestjs/common';

/**
 * Key used by the ScopesGuard to retrieve required scopes for a route.
 */
export const SCOPES_KEY = 'scopes';

/**
 * Declare one or más scopes necesarios para acceder a un handler.
 * Ejemplo:
 *   @Scopes('user:update')
 *   @UseGuards(JwtAuthGuard, ScopesGuard)
 *   updateUser() {}
 */
export const Scopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);
