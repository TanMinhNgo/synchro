export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateNotificationInput = {
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
};

export type MarkReadInput = {
  read?: boolean;
};
