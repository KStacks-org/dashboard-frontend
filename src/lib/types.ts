export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED";
export type ServiceStatus = "LIVE" | "BETA" | "COMING_SOON";
export type SponsoredProjectStatus = "PROPOSED" | "IN_REVIEW" | "ACTIVE" | "LAUNCHED" | "ARCHIVED";

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
  overview: string | null;
  repoUrl: string | null;
  healthCheckUrl: string | null;
  ownerId: string | null;
  owner?: TeamMember | null;
};

export type ServiceListItem = Service & {
  _count: { tasks: number };
  healthChecks: HealthCheck[];
};

export type ServiceDetail = Service & {
  owner: TeamMember | null;
  healthChecks: HealthCheck[];
  tasks: Task[];
};

export type HealthCheck = {
  id: string;
  serviceId: string;
  isUp: boolean;
  statusCode: number | null;
  responseTimeMs: number | null;
  error: string | null;
  checkedAt: string;
};

export type ServiceHealth = {
  id: string;
  name: string;
  codename: string;
  status: ServiceStatus;
  url: string | null;
  healthCheckUrl: string | null;
  latest: HealthCheck | null;
  history: HealthCheck[];
  uptimeRatio: number | null;
};

export type Subtask = {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  assigneeId: string | null;
  assignee: TeamMember | null;
};

export type TaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  author: TeamMember;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskLink = {
  id: string;
  taskId: string;
  url: string;
  label: string | null;
  createdAt: string;
};

export type Task = {
  id: string;
  reference: number;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: Priority;
  status: TaskStatus;
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
  comments: TaskComment[];
  links: TaskLink[];
};

export type SponsoredProject = {
  id: string;
  name: string;
  description: string;
  ownerName: string;
  contact: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  status: SponsoredProjectStatus;
  resources: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
