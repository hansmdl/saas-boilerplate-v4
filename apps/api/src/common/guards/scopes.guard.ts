import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/scopes.decorator';
import { RolesService } from '../../roles/roles.service';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no requiere scopes, permitimos el acceso.
    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string } | undefined;
    if (!user) {
      throw new ForbiddenException('No user in request');
    }

    // Obtener los scopes del usuario (podría estar en caché)
    const userScopes = await this.rolesService.getUserScopes(user.id);

    const hasAllScopes = requiredScopes.every((s) => userScopes.includes(s));
    if (!hasAllScopes) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
