import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GoalDocument = HydratedDocument<Goal>;

@Schema({ timestamps: true })
export class Goal {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop()
  targetDate?: Date;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  progress!: number;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);

GoalSchema.index({ userId: 1, createdAt: -1 });
