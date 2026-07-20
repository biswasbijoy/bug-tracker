export type TicketType = 'story' | 'task' | 'bug' | 'improvement' | 'spike' | 'technical-task' | 'research' | 'production-issue';
export type TicketStatus = 'to-do' | 'in-progress' | 'qa' | 'ready-for-qa' | 'retest' | 'blocked' | 'ready-for-deploy' | 'production' | 'closed' | 'cancelled';
export type TicketPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type TicketSeverity = 'critical' | 'major' | 'minor' | 'trivial';
export type TicketEnvironment = 'local' | 'dev' | 'qa' | 'staging' | 'uat' | 'production';

export interface ChecklistItem {
  _id?: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  _id?: string;
  text: string;
  userId: string;
  createdAt: string;
}

export interface ActivityLog {
  _id?: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketNo: string;
  jiraUrl?: string;
  title: string;
  description?: string;
  type: TicketType;
  projectId: { _id: string; name: string; color: string } | string;
  epicId?: { _id: string; name: string } | string;
  sprintId?: { _id: string; name: string } | string;
  parentTicketId?: string;
  assignedTo?: string;
  reporter?: string;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  environment: TicketEnvironment;
  deploymentDate?: string;
  releaseVersion?: string;
  productionDate?: string;
  testCompleted: boolean;
  regressionCompleted: boolean;
  smokeCompleted: boolean;
  reminderDate?: string;
  reminderTime?: string;
  labels: string[];
  tags: string[];
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments: string[];
  activityLogs: ActivityLog[];
  isFavorite: boolean;
  userId: string;
  closedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  client?: string;
  status: 'active' | 'archived';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Epic {
  _id: string;
  name: string;
  description?: string;
  projectId: string;
  userId: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  _id: string;
  name: string;
  projectId: string;
  userId: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'planned';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  totalTickets: number;
  completedToday: number;
  pending: number;
  blocked: number;
  productionPending: number;
  readyForTesting: number;
  readyForDeploy: number;
  overdue: number;
  dueToday: number;
  recentlyUpdated: Ticket[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  _id: string;
  name: string;
  color: string;
  userId: string;
}
