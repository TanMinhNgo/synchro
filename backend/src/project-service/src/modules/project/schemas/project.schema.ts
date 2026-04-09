import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { ProjectStatus } from '@/contracts/project/project.enums';

@Schema({ timestamps: true })
export class Project {
  @Prop({ trim: true, maxlength: 160, index: true, unique: true, sparse: true })
  slug?: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({ required: true, index: true })
  ownerId!: string;

  @Prop({ type: [String], default: [] })
  memberIds!: string[];

  @Prop({
    required: true,
    enum: Object.values(ProjectStatus),
    default: ProjectStatus.ACTIVE,
    index: true,
  })
  status!: ProjectStatus;
}

export type ProjectDocument = HydratedDocument<Project>;
export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ ownerId: 1, status: 1 });
ProjectSchema.index({ memberIds: 1, status: 1 });
