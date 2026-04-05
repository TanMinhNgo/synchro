import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { ProjectColumnKey } from '@/contracts/project/project.enums';

@Schema({ timestamps: true })
export class ProjectColumn {
  @Prop({ required: true, index: true })
  boardId!: string;

  @Prop({ required: true, enum: Object.values(ProjectColumnKey) })
  key!: ProjectColumnKey;

  @Prop({ required: true, trim: true, maxlength: 60 })
  name!: string;

  @Prop({ required: true, min: 0, max: 999, default: 0 })
  order!: number;
}

export type ProjectColumnDocument = HydratedDocument<ProjectColumn>;
export const ProjectColumnSchema = SchemaFactory.createForClass(ProjectColumn);

ProjectColumnSchema.index({ boardId: 1, order: 1 });
ProjectColumnSchema.index({ boardId: 1, key: 1 }, { unique: true });
