import 'reflect-metadata';
import 'dotenv/config';

import mongoose from 'mongoose';

import { Project, ProjectSchema } from '@/project-service/src/modules/project/schemas/project.schema';
import { Board, BoardSchema } from '@/project-service/src/modules/project/schemas/board.schema';
import {
  ProjectColumn,
  ProjectColumnSchema,
} from '@/project-service/src/modules/project/schemas/column.schema';
import { Label, LabelSchema } from '@/project-service/src/modules/project/schemas/label.schema';

import { Task, TaskSchema } from '@/task-service/src/modules/task/schemas/task.schema';
import {
  Notification,
  NotificationSchema,
} from '@/notification-service/src/modules/notification/schemas/notification.schema';

import { ProjectColumnKey, ProjectStatus } from '@/contracts/project/project.enums';
import { TaskPriority } from '@/contracts/task/task.enums';

type SeedOptions = {
  reset: boolean;
  dryRun: boolean;
};

function parseOptions(argv: string[]): SeedOptions {
  const reset = argv.includes('--reset') || argv.includes('--drop');
  const dryRun = argv.includes('--dry-run');

  if (argv.includes('--help') || argv.includes('-h')) {
    // eslint-disable-next-line no-console
    console.log(`Seed Synchro data\n\nUsage:\n  npm run seed -- [--reset] [--dry-run]\n\nOptions:\n  --reset, --drop   Delete existing seed collections first\n  --dry-run         Connect and print plan, do not write\n`);
    process.exit(0);
  }

  return { reset, dryRun };
}

async function main() {
  const { reset, dryRun } = parseOptions(process.argv.slice(2));

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Missing env MONGODB_URI (set it in backend/.env)');
  }

  await mongoose.connect(mongoUri);

  const ProjectModel = mongoose.model(Project.name, ProjectSchema);
  const BoardModel = mongoose.model(Board.name, BoardSchema);
  const ColumnModel = mongoose.model(ProjectColumn.name, ProjectColumnSchema);
  const LabelModel = mongoose.model(Label.name, LabelSchema);
  const TaskModel = mongoose.model(Task.name, TaskSchema);
  const NotificationModel = mongoose.model(Notification.name, NotificationSchema);

  if (reset) {
    if (dryRun) {
      // eslint-disable-next-line no-console
      console.log('[dry-run] reset requested: would delete collections');
    } else {
      await Promise.all([
        ProjectModel.deleteMany({}),
        BoardModel.deleteMany({}),
        ColumnModel.deleteMany({}),
        LabelModel.deleteMany({}),
        TaskModel.deleteMany({}),
        NotificationModel.deleteMany({}),
      ]);
    }
  }

  const user1 = 'seed-user-1';
  const user2 = 'seed-user-2';

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log('[dry-run] would create: 1 project, 1 board, 4 columns, 2 labels, 4 tasks, 3 notifications');
    return;
  }

  const project = await ProjectModel.create({
    ownerId: user1,
    memberIds: [user2],
    name: 'Seed Project',
    description: 'Sample data created by seed script',
    status: ProjectStatus.ACTIVE,
  });

  const board = await BoardModel.create({
    projectId: project.id,
    name: 'Main Board',
    description: 'Default board',
  });

  const columns = await ColumnModel.insertMany([
    { boardId: board.id, key: ProjectColumnKey.backlog, name: 'Backlog', order: 0 },
    { boardId: board.id, key: ProjectColumnKey.in_progress, name: 'In Progress', order: 1 },
    { boardId: board.id, key: ProjectColumnKey.in_review, name: 'In Review', order: 2 },
    { boardId: board.id, key: ProjectColumnKey.done, name: 'Done', order: 3 },
  ]);

  const labels = await LabelModel.insertMany([
    { projectId: project.id, name: 'Bug', color: 'red' },
    { projectId: project.id, name: 'Feature', color: 'blue' },
  ]);

  const bugLabelId = labels.find((l) => l.name === 'Bug')?.id;
  const featureLabelId = labels.find((l) => l.name === 'Feature')?.id;

  const tasks = await TaskModel.insertMany([
    {
      projectId: project.id,
      boardId: board.id,
      columnKey: ProjectColumnKey.backlog,
      title: 'Set up environment',
      description: 'Install dependencies and configure .env',
      createdBy: user1,
      assigneeId: user2,
      priority: TaskPriority.high,
      labelIds: featureLabelId ? [featureLabelId] : [],
      subtasks: [
        { id: 's1', title: 'Install node modules', isDone: true },
        { id: 's2', title: 'Run services', isDone: false },
      ],
      order: 0,
    },
    {
      projectId: project.id,
      boardId: board.id,
      columnKey: ProjectColumnKey.in_progress,
      title: 'Create first project',
      description: 'Use /projects API to create a project',
      createdBy: user1,
      assigneeId: user1,
      priority: TaskPriority.medium,
      labelIds: [],
      subtasks: [],
      order: 1,
    },
    {
      projectId: project.id,
      boardId: board.id,
      columnKey: ProjectColumnKey.in_review,
      title: 'Fix notification UI',
      description: 'Verify realtime notifications in dashboard',
      createdBy: user2,
      assigneeId: user1,
      priority: TaskPriority.urgent,
      labelIds: bugLabelId ? [bugLabelId] : [],
      subtasks: [],
      order: 2,
    },
    {
      projectId: project.id,
      boardId: board.id,
      columnKey: ProjectColumnKey.done,
      title: 'Read docs',
      description: 'Check backend/docs/database.md',
      createdBy: user1,
      assigneeId: user2,
      priority: TaskPriority.low,
      labelIds: [],
      subtasks: [],
      order: 3,
    },
  ]);

  await NotificationModel.insertMany([
    {
      userId: user1,
      type: 'SEED',
      title: 'Seed completed',
      message: `Created project ${project.id}`,
      data: { projectId: project.id },
      readAt: null,
    },
    {
      userId: user2,
      type: 'TASK_ASSIGNED',
      title: 'Task assigned',
      message: `You were assigned: ${tasks[0]?.title}`,
      data: { taskId: tasks[0]?.id, projectId: project.id },
      readAt: null,
    },
    {
      userId: user1,
      type: 'TASK_REVIEW',
      title: 'Task ready for review',
      message: `Review: ${tasks[2]?.title}`,
      data: { taskId: tasks[2]?.id, projectId: project.id },
      readAt: null,
    },
  ]);

  // eslint-disable-next-line no-console
  console.log('Seeded successfully:', {
    projectId: project.id,
    boardId: board.id,
    columnIds: columns.map((c) => c.id),
    labelIds: labels.map((l) => l.id),
    taskIds: tasks.map((t) => t.id),
  });
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
