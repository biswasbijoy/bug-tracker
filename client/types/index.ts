export type TicketType =
  | 'story' | 'task' | 'bug' | 'improvement' | 'spike' | 'technical-task' | 'research' | 'production-issue';

export type TicketStatus =
  | 'open' | 'backlog' | 'ready' | 'in-progress' | 'blocked' | 'code-review'
  | 'ready-for-qa' | 'qa-in-progress' | 'qa-failed' | 'ready-for-release' | 'released'
  | 'done' | 'closed' | 'reopened' | 'cancelled' | 'stage' | 'to-do';

export type TicketPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type TicketSeverity = 'critical' | 'major' | 'minor' | 'trivial';
export type TicketEnvironment = 'local' | 'dev' | 'qa' | 'staging' | 'uat' | 'production';

export interface ChecklistItem {
  _id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  _id: string;
  text: string;
  /** author display name (resolved by the server) */
  author: string;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  author: string;
  createdAt: string;
}

/**
 * Client-side ticket. The API returns populated references (projectId: {_id, name, color}); the store
 * normalises them to plain ids so components look names up via the workspace store.
 */
export interface Ticket {
  _id: string;
  ticketNo: string;
  title: string;
  description?: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  environment: TicketEnvironment;
  projectId: string;
  epicId?: string;
  sprintId?: string;
  parentTicketId?: string;
  assignedTo?: string;
  reporter?: string;
  jiraUrl?: string;
  /** "due date" in the UI */
  reminderDate?: string;
  reminderTime?: string;
  deploymentDate?: string;
  releaseVersion?: string;
  productionDate?: string;
  testCompleted: boolean;
  regressionCompleted: boolean;
  smokeCompleted: boolean;
  labels: string[];
  tags: string[];
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments: string[];
  activityLogs: ActivityLog[];
  isFavorite: boolean;
  closedDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields accepted by POST/PUT /tickets. Empty string clears an optional reference/date. */
export type TicketInput = Partial<
  Pick<
    Ticket,
    | 'title' | 'description' | 'type' | 'status' | 'priority' | 'severity' | 'environment'
    | 'projectId' | 'epicId' | 'sprintId' | 'parentTicketId' | 'assignedTo' | 'reporter' | 'jiraUrl'
    | 'reminderDate' | 'reminderTime' | 'deploymentDate' | 'releaseVersion' | 'productionDate'
    | 'testCompleted' | 'regressionCompleted' | 'smokeCompleted' | 'labels' | 'tags' | 'isFavorite'
  >
>;

export interface Project {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  client?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Epic {
  _id: string;
  name: string;
  description?: string;
  projectId: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  _id: string;
  name: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'planned';
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  _id: string;
  name: string;
  color: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
