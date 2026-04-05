import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Label {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, trim: true, maxlength: 40 })
  name!: string;

  @Prop({ trim: true, maxlength: 30 })
  color?: string;
}

export type LabelDocument = HydratedDocument<Label>;
export const LabelSchema = SchemaFactory.createForClass(Label);

LabelSchema.index({ projectId: 1, name: 1 }, { unique: true });
