import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateGoalDto } from '@/contracts/goals/dto/create-goal.dto';
import { UpdateGoalDto } from '@/contracts/goals/dto/update-goal.dto';
import { Goal, GoalDocument } from './schemas/goal.schema';

export type GoalResponse = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number;
  createdAt?: string;
  updatedAt?: string;
};

function toResponse(doc: GoalDocument): GoalResponse {
  return {
    id: doc.id,
    userId: doc.userId.toString(),
    title: doc.title,
    description: doc.description,
    targetDate: doc.targetDate ? doc.targetDate.toISOString() : undefined,
    progress: doc.progress,
    createdAt: (doc as any).createdAt?.toISOString?.() ?? (doc as any).createdAt,
    updatedAt: (doc as any).updatedAt?.toISOString?.() ?? (doc as any).updatedAt,
  };
}

@Injectable()
export class GoalsService {
  constructor(@InjectModel(Goal.name) private readonly model: Model<Goal>) {}

  async list(userId: string): Promise<GoalResponse[]> {
    const uid = new Types.ObjectId(userId);
    const docs = await this.model
      .find({ userId: uid })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => toResponse(d as unknown as GoalDocument));
  }

  async create(userId: string, dto: CreateGoalDto): Promise<GoalResponse> {
    const uid = new Types.ObjectId(userId);
    const doc = await this.model.create({
      userId: uid,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
      progress: typeof dto.progress === 'number' ? dto.progress : 0,
    });
    return toResponse(doc as unknown as GoalDocument);
  }

  async update(
    userId: string,
    goalId: string,
    dto: UpdateGoalDto,
  ): Promise<GoalResponse> {
    const uid = new Types.ObjectId(userId);

    const update: Record<string, unknown> = {};
    if (typeof dto.title === 'string') update.title = dto.title.trim();
    if (typeof dto.description === 'string') update.description = dto.description.trim();
    if (dto.targetDate !== undefined) {
      update.targetDate = dto.targetDate ? new Date(dto.targetDate) : undefined;
    }
    if (typeof dto.progress === 'number') update.progress = dto.progress;

    const doc = await this.model
      .findOneAndUpdate({ _id: goalId, userId: uid }, update, { new: true })
      .exec();

    if (!doc) throw new NotFoundException('Goal not found');
    return toResponse(doc as unknown as GoalDocument);
  }

  async remove(userId: string, goalId: string): Promise<{ ok: true }> {
    const uid = new Types.ObjectId(userId);
    const res = await this.model.deleteOne({ _id: goalId, userId: uid }).exec();
    if (!res.deletedCount) throw new NotFoundException('Goal not found');
    return { ok: true };
  }
}
