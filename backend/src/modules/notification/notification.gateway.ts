import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationGateway {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private extractToken(client: Socket): string | undefined {
    const authToken = (client.handshake.auth as any)?.token as
      | string
      | undefined;
    if (authToken) return authToken;

    const header = client.handshake.headers?.authorization;
    if (!header) return undefined;
    const [kind, token] = header.split(' ');
    if (kind?.toLowerCase() !== 'bearer') return undefined;
    return token;
  }

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      client.data.userId = payload.sub;
      client.join(payload.sub);
      this.logger.debug(`Client connected: ${client.id} user=${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(userId).emit(event, payload);
  }

  @SubscribeMessage('ping')
  ping(@ConnectedSocket() client: Socket, @MessageBody() body: any) {
    return { ok: true, userId: client.data.userId, echo: body ?? null };
  }
}
