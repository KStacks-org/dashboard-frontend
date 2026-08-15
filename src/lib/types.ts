export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED";
export type ServiceStatus = "LIVE" | "BETA" | "COMING_SOON";
export type SponsoredProjectStatus = "PROPOSED" | "IN_REVIEW" | "ACTIVE" | "LAUNCHED" | "ARCHIVED";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamMember = {
  id: string;
  email: string;
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
  milestoneId: string | null;
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

export type UserRole = "ADMIN" | "MEMBER";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type NotificationType =
  | "TASK_ASSIGNED"
  | "SUBTASK_ASSIGNED"
  | "COMMENT_MENTION"
  | "ISSUE_ASSIGNED"
  | "DEADLINE_SOON";

export type TeamMemberProfile = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  jobTitle: string | null;
  responsibilities: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  workload: {
    activeTasks: number;
    completedTasks: number;
    todo: number;
    inProgress: number;
    blocked: number;
    openIssues: number;
  };
};

export type Issue = {
  id: string;
  reference: number;
  title: string;
  description: string | null;
  priority: Priority;
  status: IssueStatus;
  serviceId: string | null;
  service: { id: string; name: string; codename: string } | null;
  assigneeId: string | null;
  assignee: TeamMember | null;
  reportedById: string;
  reportedBy: TeamMember;
  convertedTaskId: string | null;
  convertedTask: { id: string; reference: number; title: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type MilestoneProgress = {
  totalTasks: number;
  completedTasks: number;
  percent: number | null;
};

export type Milestone = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  progress: MilestoneProgress;
};

export type MilestoneDetail = Milestone & {
  tasks: Array<Task & { assignees: Array<{ user: { id: string; displayName: string } }> }>;
};

export type AppNotification = {
  id: string;
  type: NotificationType;
  body: string;
  isRead: boolean;
  createdAt: string;
  actor: { id: string; displayName: string } | null;
  task: { id: string; reference: number; title: string } | null;
  issue: { id: string; reference: number; title: string } | null;
};

export type OverviewData = {
  stats: {
    activeTasks: number;
    completedThisWeek: number;
    openIssues: number;
    servicesUp: number;
    servicesMonitored: number;
    servicesTotal: number;
    overdueTasks: number;
    dueSoonTasks: number;
  };
  myTasks: Array<Task & { subtaskTotal: number; subtaskCompleted: number }>;
  milestones: Array<{
    id: string;
    title: string;
    deadline: string | null;
    totalTasks: number;
    completedTasks: number;
  }>;
};

export type GitHubActivity = {
  org: string;
  fetchedAt: string;
  authenticated: boolean;
  rateLimited: boolean;
  repositories: Array<{
    name: string;
    description: string | null;
    url: string;
    defaultBranch: string;
    language: string | null;
    openIssues: number;
    pushedAt: string | null;
  }>;
  commits: Array<{
    sha: string;
    message: string;
    author: string;
    avatarUrl: string | null;
    repo: string;
    url: string;
    committedAt: string;
  }>;
  pullRequests: Array<{
    number: number;
    title: string;
    author: string;
    avatarUrl: string | null;
    repo: string;
    url: string;
    state: string;
    isDraft: boolean;
    updatedAt: string;
  }>;
  issues: Array<{
    number: number;
    title: string;
    author: string;
    avatarUrl: string | null;
    repo: string;
    url: string;
    state: string;
    updatedAt: string;
  }>;
  branches: Array<{ repo: string; name: string; url: string; isDefault: boolean }>;
};
