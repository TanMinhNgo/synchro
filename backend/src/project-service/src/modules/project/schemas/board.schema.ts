import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Board {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;
}

export type BoardDocument = HydratedDocument<Board>;
export const BoardSchema = SchemaFactory.createForClass(Board);

BoardSchema.index({ projectId: 1, createdAt: -1 });
