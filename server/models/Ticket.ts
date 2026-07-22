import mongoose, { Document, Schema } from 'mongoose';

export type TicketType = 'story' | 'task' | 'bug' | 'improvement' | 'spike' | 'technical-task' | 'research' | 'production-issue';
export type TicketStatus = 'open' | 'backlog' | 'ready' | 'in-progress' | 'blocked' | 'code-review' | 'ready-for-qa' | 'qa-in-progress' | 'qa-failed' | 'ready-for-release' | 'released' | 'done' | 'closed' | 'reopened' | 'cancelled' | 'stage';
export type TicketPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type TicketSeverity = 'critical' | 'major' | 'minor' | 'trivial';
export type TicketEnvironment = 'local' | 'dev' | 'qa' | 'staging' | 'uat' | 'production';

export interface IChecklistItem {
  text: string;
  completed: boolean;
}

export interface IComment {
  text: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IActivityLog {
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketNo: string;
  jiraUrl?: string;
  title: string;
  description?: string;
  type: TicketType;
  projectId: mongoose.Types.ObjectId;
  epicId?: mongoose.Types.ObjectId;
  sprintId?: mongoose.Types.ObjectId;
  parentTicketId?: mongoose.Types.ObjectId;
  assignedTo?: string;
  reporter?: string;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  environment: TicketEnvironment;
  deploymentDate?: Date;
  releaseVersion?: string;
  productionDate?: Date;
  testCompleted: boolean;
  regressionCompleted: boolean;
  smokeCompleted: boolean;
  reminderDate?: Date;
  reminderTime?: string;
  labels: string[];
  tags: string[];
  checklist: IChecklistItem[];
  comments: IComment[];
  attachments: string[];
  activityLogs: IActivityLog[];
  isFavorite: boolean;
  userId: mongoose.Types.ObjectId;
  closedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  { text: { type: String, required: true }, completed: { type: Boolean, default: false } },
  { _id: false }
);

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: { type: String, required: true },
    field: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketNo: { type: String, required: true, trim: true },
    jiraUrl: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['story', 'task', 'bug', 'improvement', 'spike', 'technical-task', 'research', 'production-issue'],
      default: 'task',
    },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    epicId: { type: Schema.Types.ObjectId, ref: 'Epic' },
    sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint' },
    parentTicketId: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    assignedTo: { type: String, trim: true },
    reporter: { type: String, trim: true },
    status: {
      type: String,
      enum: ['open', 'backlog', 'ready', 'in-progress', 'blocked', 'code-review', 'ready-for-qa', 'qa-in-progress', 'qa-failed', 'ready-for-release', 'released', 'done', 'closed', 'reopened', 'cancelled', 'stage'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['highest', 'high', 'medium', 'low', 'lowest'],
      default: 'medium',
    },
    severity: {
      type: String,
      enum: ['critical', 'major', 'minor', 'trivial'],
      default: 'major',
    },
    environment: {
      type: String,
      enum: ['local', 'dev', 'qa', 'staging', 'uat', 'production'],
      default: 'qa',
    },
    deploymentDate: { type: Date },
    releaseVersion: { type: String, trim: true },
    productionDate: { type: Date },
    testCompleted: { type: Boolean, default: false },
    regressionCompleted: { type: Boolean, default: false },
    smokeCompleted: { type: Boolean, default: false },
    reminderDate: { type: Date },
    reminderTime: { type: String },
    labels: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    checklist: [ChecklistItemSchema],
    comments: [CommentSchema],
    attachments: [{ type: String }],
    activityLogs: [ActivityLogSchema],
    isFavorite: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    closedDate: { type: Date },
  },
  { timestamps: true }
);

TicketSchema.index({ ticketNo: 'text', title: 'text' });
TicketSchema.index({ projectId: 1, status: 1 });
TicketSchema.index({ userId: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ isFavorite: 1 });

export default mongoose.model<ITicket>('Ticket', TicketSchema);
