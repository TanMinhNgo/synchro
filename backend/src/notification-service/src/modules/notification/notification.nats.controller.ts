import { Controller, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateNotificationDto } from '@/contracts/notification/dto/create-notification.dto';
import { notificationServiceSubjects } from '@/contracts/notification/notification.subjects';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationNatsController {
  constructor(private readonly notifications: NotificationService) {}

  @MessagePattern(notificationServiceSubjects.list)
  async list(
    @Payload() payload: { userId: string; params: { unreadOnly?: boolean } },
  ) {
    const notifications = await this.notifications.listForUser(
      payload.userId,
      payload.params,
    );
    return { notifications };
  }

  @MessagePattern(notificationServiceSubjects.create)
  async create(
    @Payload() payload: { userId: string; dto: CreateNotificationDto },
  ) {
    const notification = await this.notifications.createForUser(
      payload.userId,
      payload.dto,
    );
    return { notification };
  }

  @MessagePattern(notificationServiceSubjects.markRead)
  async markRead(
    @Payload()
    payload: {
      userId: string;
      notificationId: string;
      read: boolean;
    },
  ) {
    const notification = await this.notifications.markRead(
      payload.userId,
      payload.notificationId,
      payload.read,
    );
    if (!notification) throw new NotFoundException('Notification not found');
    return { notification };
  }

  @MessagePattern(notificationServiceSubjects.markAllRead)
  async markAllRead(@Payload() payload: { userId: string }) {
    const res = await this.notifications.markAllRead(payload.userId);
    return res;
  }
}
