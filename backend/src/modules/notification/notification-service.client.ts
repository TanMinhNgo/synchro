import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import type { CreateNotificationDto } from '@/contracts/notification/dto/create-notification.dto';
import { notificationServiceSubjects } from '@/contracts/notification/notification.subjects';
import { NOTIFICATION_SERVICE_NATS_CLIENT } from './notification-service.nats';

@Injectable()
export class NotificationServiceClient {
  constructor(
    @Inject(NOTIFICATION_SERVICE_NATS_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  private async send<Req, Res>(subject: string, payload: Req): Promise<Res> {
    try {
      return await firstValueFrom(
        this.client.send<Res, Req>(subject, payload).pipe(timeout(5000)),
      );
    } catch {
      throw new BadGatewayException(
        'notification-service (NATS) request failed',
      );
    }
  }

  list(userId: string, params: { unreadOnly?: boolean }) {
    return this.send<
      { userId: string; params: { unreadOnly?: boolean } },
      { notifications: unknown[] }
    >(notificationServiceSubjects.list, { userId, params });
  }

  create(userId: string, dto: CreateNotificationDto) {
    return this.send<
      { userId: string; dto: CreateNotificationDto },
      { notification: unknown }
    >(notificationServiceSubjects.create, { userId, dto });
  }

  markRead(userId: string, notificationId: string, read: boolean) {
    return this.send<
      { userId: string; notificationId: string; read: boolean },
      { notification: unknown | null }
    >(notificationServiceSubjects.markRead, { userId, notificationId, read });
  }

  markAllRead(userId: string) {
    return this.send<{ userId: string }, { ok: true }>(
      notificationServiceSubjects.markAllRead,
      { userId },
    );
  }
}
