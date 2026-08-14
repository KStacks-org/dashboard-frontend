export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type ServiceStatus = "LIVE" | "BETA" | "COMING_SOON";

export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamMember = {
  id: string;
  username: string;
  displayName: string;
};

export type Service = {
  id: string;
  name: string;
  codename: string;
  tagline: string;
  description: string;
  status: ServiceStatus;
  url: string | null;
  sortOrder: number;
};

export type Subtask = {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: Priority;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  serviceId: string | null;
  service: Service | null;
  createdById: string;
  createdBy: TeamMember;
  assignees: Array<{ userId: string; user: TeamMember }>;
  subtasks: Subtask[];
};
