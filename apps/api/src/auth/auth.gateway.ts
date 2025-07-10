import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RolesService } from '../roles/roles.service';
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

  constructor(private readonly rolesService: RolesService) {}

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
}
