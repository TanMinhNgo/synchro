import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, trim: true, maxlength: 80, index: true })
  type!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ trim: true, maxlength: 2000 })
  message?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data?: Record<string, unknown>;

  @Prop({ type: Date, default: null })
  readAt?: Date | null;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
