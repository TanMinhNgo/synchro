import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Board } from './schemas/board.schema';
import { Label } from './schemas/label.schema';
import { Project } from './schemas/project.schema';
import { ProjectColumn } from './schemas/column.schema';

export class ProjectRepository {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Board.name) private readonly boardModel: Model<Board>,
    @InjectModel(ProjectColumn.name)
    private readonly columnModel: Model<ProjectColumn>,
    @InjectModel(Label.name) private readonly labelModel: Model<Label>,
  ) {}

  createProject(
    data: Omit<Project, 'status' | 'memberIds'> &
      Partial<Pick<Project, 'status' | 'memberIds'>>,
  ) {
    return this.projectModel.create(data);
  }

  findProjectsForUser(userId: string) {
    return this.projectModel
      .find({ $or: [{ ownerId: userId }, { memberIds: userId }] })
      .sort({ createdAt: -1 })
      .lean();
  }

  findProjectById(projectId: string) {
    return this.projectModel.findById(projectId).lean();
  }

  findProjectBySlug(slug: string) {
    return this.projectModel.findOne({ slug }).lean();
  }

  setProjectSlugById(projectId: string, slug: string) {
    return this.projectModel
      .findByIdAndUpdate(projectId, { slug }, { new: true })
      .lean();
  }

  updateProject(projectId: string, patch: Partial<Project>) {
    return this.projectModel
      .findByIdAndUpdate(projectId, patch, { new: true })
      .lean();
  }

  deleteProject(projectId: string) {
    return this.projectModel.findByIdAndDelete(projectId).lean();
  }

  createBoard(data: Board) {
    return this.boardModel.create(data);
  }

  findBoardsByProjectId(projectId: string) {
    return this.boardModel.find({ projectId }).sort({ createdAt: -1 }).lean();
  }

  findBoardById(boardId: string) {
    return this.boardModel.findById(boardId).lean();
  }

  createColumn(data: ProjectColumn) {
    return this.columnModel.create(data);
  }

  findColumnsByBoardId(boardId: string) {
    return this.columnModel.find({ boardId }).sort({ order: 1 }).lean();
  }

  updateColumn(columnId: string, patch: Partial<ProjectColumn>) {
    return this.columnModel
      .findByIdAndUpdate(columnId, patch, { new: true })
      .lean();
  }

  deleteColumnsByBoardId(boardId: string) {
    return this.columnModel.deleteMany({ boardId });
  }

  createLabel(data: Label) {
    return this.labelModel.create(data);
  }

  findLabelsByProjectId(projectId: string) {
    return this.labelModel.find({ projectId }).sort({ createdAt: -1 }).lean();
  }

  deleteLabel(labelId: string) {
    return this.labelModel.findByIdAndDelete(labelId).lean();
  }
}
