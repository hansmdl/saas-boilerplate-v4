import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RolesService } from '../roles/roles.service';
import { PrismaService, Role } from 'db';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/ws/auth',
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class AuthGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;
  private readonly logger = new Logger(AuthGateway.name);

  constructor(
    private readonly rolesService: RolesService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(socket: Socket) {
    // JWT auth mínima: token por query param (mejorar esto en producción)
    const userId = socket.handshake.query.userId as string;
    if (!userId) {
      socket.disconnect();
      return;
    }
    const scopes = await this.rolesService.getUserScopes(userId);
    socket.emit('scopes', scopes);
    this.logger.log(`Scopes enviados a usuario ${userId}`);
  }

  /**
   * Enviar scopes bajo demanda.
   */
  @SubscribeMessage('request_scopes')
  async handleRequestScopes(@ConnectedSocket() socket: Socket) {
    const userId = socket.handshake.query.userId as string;
    if (!userId) return;
    const scopes = await this.rolesService.getUserScopes(userId);
    socket.emit('scopes', scopes);
  }

  /**
   * Permite a un miembro de staff asignar un rol a otro usuario.
   * Requiere scope "user:update".
   */
  @SubscribeMessage('assign_role')
  async handleAssignRole(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: { targetUserId: string; role: string },
  ) {
    const requesterId = socket.handshake.query.userId as string;
    if (!requesterId) return;

    const requesterScopes = await this.rolesService.getUserScopes(requesterId);
    if (!requesterScopes.includes('user:update')) {
      socket.emit('error', 'Insufficient permissions');
      return;
    }

    await this.rolesService.assignRole(payload.targetUserId, payload.role as any);
    socket.emit('role_assigned', { ok: true });

    // Actualizar scopes del usuario afectado si está conectado
    const connected = await this.server.fetchSockets();
    for (const s of connected) {
      if (s.handshake.query.userId === payload.targetUserId) {
        const newScopes = await this.rolesService.getUserScopes(payload.targetUserId);
        s.emit('scopes', newScopes);
      }
    }
  }

  /**
   * Devuelve lista de usuarios (id, email, roles) para staff con scope "user:read".
   */
  @SubscribeMessage('list_users')
  async handleListUsers(@ConnectedSocket() socket: Socket) {
    const requesterId = socket.handshake.query.userId as string;
    if (!requesterId) return;
    const scopes = await this.rolesService.getUserScopes(requesterId);
    if (!scopes.includes('user:read')) {
      socket.emit('error', 'Insufficient permissions');
      return;
    }
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true, roles: true },
    });
    socket.emit('users_list', users);
  }
}
