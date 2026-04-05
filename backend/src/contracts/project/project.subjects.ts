export const projectServiceSubjects = {
  listProjects: 'projects.list',
  createProject: 'projects.create',
  getProject: 'projects.get',
  updateProject: 'projects.update',
  deleteProject: 'projects.delete',

  listBoards: 'projects.boards.list',
  createBoard: 'projects.boards.create',

  listColumns: 'projects.columns.list',
  createColumn: 'projects.columns.create',
  updateColumn: 'projects.columns.update',

  listLabels: 'projects.labels.list',
  createLabel: 'projects.labels.create',
  deleteLabel: 'projects.labels.delete',
} as const;
