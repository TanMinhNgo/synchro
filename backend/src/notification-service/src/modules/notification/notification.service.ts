import { Injectable } from '@nestjs/common';
import type { CreateNotificationDto } from '@/contracts/notification/dto/create-notification.dto';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  constructor(private readonly repo: NotificationRepository) {}

  async listForUser(userId: string, params?: { unreadOnly?: boolean }) {
    return this.repo.findForUser(userId, params);
  }

  async createForUser(userId: string, dto: CreateNotificationDto) {
    const notification = await this.repo.createNotification({
      userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: dto.data,
      readAt: null,
    });
    return notification.toObject();
  }

  async markRead(userId: string, notificationId: string, read: boolean) {
    const updated = await this.repo.markReadForUser(
      userId,
      notificationId,
      read ? new Date() : null,
    );
    return updated;
  }

  async markAllRead(userId: string) {
    await this.repo.markAllRead(userId, new Date());
    return { ok: true };
  }
}
