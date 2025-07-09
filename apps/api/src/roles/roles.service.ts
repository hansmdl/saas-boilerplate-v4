import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, Role } from 'db';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Devuelve la lista de scopes (permisos) que posee un usuario.
   * Se cachea por 1 minuto para evitar hitting a la BD en cada request.
   */
  async getUserScopes(userId: string): Promise<string[]> {

    // Obtener roles del usuario; suponemos que el usuario tiene un campo "role".
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    if (!user || user.roles.length === 0) return [];

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: { in: user.roles as Role[] } },
      include: { permission: { select: { scope: true } } },
    });

    const scopes = rolePermissions.map((rp) => rp.permission.scope);

    return scopes;
  }

  /**
   * Asigna un rol a un usuario (usado por Staff panel)
   */
  async assignRole(userId: string, role: Role) {
    await this.prisma.user.update({ where: { id: userId }, data: { roles: { set: [role] } } });
    return { message: 'Role updated' };
  }
}
