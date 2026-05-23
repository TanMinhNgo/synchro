import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

type StoredIssue = {
  code: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
};

@Schema({ timestamps: true })
export class TaskReportHistory {
  @Prop({ required: true, index: true })
  taskId!: string;

  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, index: true })
  actorUserId!: string;

  @Prop({ required: true, trim: true, maxlength: 3000 })
  reportText!: string;

  @Prop()
  progressPercent?: number;

  @Prop()
  workedHours?: number;

  @Prop({ trim: true, maxlength: 2000 })
  blockers?: string;

  @Prop({ trim: true, maxlength: 2000 })
  nextActions?: string;

  @Prop({ required: true })
  verdict!: 'needs_fix' | 'review_manually' | 'reasonable';

  @Prop({ required: true, min: 0, max: 100 })
  score!: number;

  @Prop({ type: [Object], default: [] })
  issues!: StoredIssue[];

  @Prop({ type: [String], default: [] })
  recommendations!: string[];

  @Prop({ required: true })
  analysisSource!: 'llm+rules' | 'rules-only';

  @Prop({ trim: true, maxlength: 4000 })
  llmSummary?: string;

  @Prop({ type: Date })
  submittedAt?: Date;
}

export type TaskReportHistoryDocument = HydratedDocument<TaskReportHistory>;

export const TaskReportHistorySchema =
  SchemaFactory.createForClass(TaskReportHistory);

TaskReportHistorySchema.index({ taskId: 1, createdAt: -1 });
TaskReportHistorySchema.index({ projectId: 1, createdAt: -1 });
