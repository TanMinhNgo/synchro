import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schemas/notification.schema';

export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name) private readonly model: Model<Notification>,
  ) {}

  createNotification(data: Notification) {
    return this.model.create(data);
  }

  findForUser(userId: string, params?: { unreadOnly?: boolean }) {
    const filter: any = { userId };
    if (params?.unreadOnly) filter.readAt = null;

    return this.model.find(filter).sort({ createdAt: -1 }).lean();
  }

  markReadForUser(userId: string, notificationId: string, readAt: Date | null) {
    return this.model
      .findOneAndUpdate(
        { _id: notificationId, userId },
        { readAt },
        { new: true },
      )
      .lean();
  }

  markAllRead(userId: string, readAt: Date) {
    return this.model.updateMany({ userId, readAt: null }, { readAt });
  }
}
