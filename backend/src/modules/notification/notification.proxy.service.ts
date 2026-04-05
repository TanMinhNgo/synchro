import { Injectable } from '@nestjs/common';
import type { CreateNotificationDto } from '@/contracts/notification/dto/create-notification.dto';
import { NotificationGateway } from './notification.gateway';
import { NotificationServiceClient } from './notification-service.client';

@Injectable()
export class NotificationProxyService {
  constructor(
    private readonly client: NotificationServiceClient,
    private readonly gateway: NotificationGateway,
  ) {}

  async list(userId: string, params: { unreadOnly?: boolean }) {
    const res = await this.client.list(userId, params);
    return res.notifications;
  }

  async create(userId: string, dto: CreateNotificationDto) {
    const res = await this.client.create(userId, dto);
    this.gateway.emitToUser(userId, 'notification:new', res.notification);
    return res.notification;
  }

  async markRead(userId: string, notificationId: string, read: boolean) {
    const res = await this.client.markRead(userId, notificationId, read);
    if (res.notification) {
      this.gateway.emitToUser(userId, 'notification:updated', res.notification);
    }
    return res.notification;
  }

  async markAllRead(userId: string) {
    const res = await this.client.markAllRead(userId);
    this.gateway.emitToUser(userId, 'notification:read_all', { ok: true });
    return res;
  }
}
