import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './schemas/task.schema';

export class TaskRepository {
  constructor(@InjectModel(Task.name) private readonly taskModel: Model<Task>) {}

  createTask(data: Task) {
    return this.taskModel.create(data);
  }

  findTasks(
    filter: Partial<
      Pick<Task, 'projectId' | 'boardId' | 'columnKey' | 'assigneeId'>
    >,
  ) {
    return this.taskModel.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  }

  findTaskById(taskId: string) {
    return this.taskModel.findById(taskId).lean();
  }

  updateTask(taskId: string, patch: Partial<Task>) {
    return this.taskModel.findByIdAndUpdate(taskId, patch, { new: true }).lean();
  }

  deleteTask(taskId: string) {
    return this.taskModel.findByIdAndDelete(taskId).lean();
  }
}
