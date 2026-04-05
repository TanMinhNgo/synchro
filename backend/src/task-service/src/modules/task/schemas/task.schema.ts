import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { ProjectColumnKey } from '@/contracts/project/project.enums';
import { TaskPriority } from '@/contracts/task/task.enums';

export type Subtask = {
  id: string;
  title: string;
  isDone: boolean;
};

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, index: true })
  boardId!: string;

  @Prop({ required: true, enum: Object.values(ProjectColumnKey), index: true })
  columnKey!: ProjectColumnKey;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ trim: true, maxlength: 5000 })
  description?: string;

  @Prop({ required: true, index: true })
  createdBy!: string;

  @Prop({ index: true })
  assigneeId?: string;

  @Prop({ required: true, enum: Object.values(TaskPriority), index: true })
  priority!: TaskPriority;

  @Prop({ type: [String], default: [] })
  labelIds!: string[];

  @Prop({
    type: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        isDone: { type: Boolean, required: true },
      },
    ],
    default: [],
  })
  subtasks!: Subtask[];

  @Prop({ required: true, min: 0, max: 999999, default: 0 })
  order!: number;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ projectId: 1, boardId: 1, columnKey: 1, order: 1 });
TaskSchema.index({ projectId: 1, assigneeId: 1, createdAt: -1 });
