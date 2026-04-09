export type Goal = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateGoalInput = {
  title: string;
  description?: string;
  targetDate?: string;
  progress?: number;
};

export type UpdateGoalInput = Partial<CreateGoalInput>;
