import { Response } from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { Epic, Project, Sprint, Ticket } from '../models';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config';

// ---------------------------------------------------------------- helpers

/** Fields a client may set. Everything else (userId, ticketNo, comments, activityLogs…) is server-managed. */
const EDITABLE_FIELDS = [
  'jiraUrl', 'title', 'description', 'type', 'projectId', 'epicId', 'sprintId', 'parentTicketId',
  'assignedTo', 'reporter', 'status', 'priority', 'severity', 'environment',
  'deploymentDate', 'releaseVersion', 'productionDate',
  'testCompleted', 'regressionCompleted', 'smokeCompleted',
  'reminderDate', 'reminderTime', 'labels', 'tags', 'isFavorite',
] as const;

const OPTIONAL_REF_FIELDS = ['epicId', 'sprintId', 'parentTicketId'];
const OPTIONAL_DATE_FIELDS = ['deploymentDate', 'productionDate', 'reminderDate'];
const OPTIONAL_TEXT_FIELDS = ['jiraUrl', 'releaseVersion', 'reminderTime', 'assignedTo', 'reporter'];
const CLOSED_STATUSES = ['closed', 'done'];

/** Human readable names for fields recorded in the activity log. */
const TRACKED_FIELDS: Record<string, string> = {
  title: 'Title',
  status: 'Status',
  priority: 'Priority',
  severity: 'Severity',
  type: 'Type',
  environment: 'Environment',
  assignedTo: 'Assignee',
  reporter: 'Reporter',
  epicId: 'Epic',
  sprintId: 'Sprint',
  reminderDate: 'Due date',
  deploymentDate: 'Deployment date',
  productionDate: 'Production date',
  releaseVersion: 'Release version',
  testCompleted: 'Test sign-off',
  regressionCompleted: 'Regression sign-off',
  smokeCompleted: 'Smoke sign-off',
};

const isEmpty = (v: unknown) => v === '' || v === null || v === undefined;

const populateTicket = (query: any) =>
  query
    .populate('projectId', 'name color')
    .populate('epicId', 'name')
    .populate('sprintId', 'name')
    .populate('comments.userId', 'name')
    .populate('activityLogs.userId', 'name');

const loadPopulated = (id: string, userId?: string) =>
  populateTicket(Ticket.findOne({ _id: id, userId }));

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PRIORITY_RANK: Record<string, number> = { highest: 5, high: 4, medium: 3, low: 2, lowest: 1 };

/** Splits a request body into a whitelisted $set / $unset pair. */
function buildChanges(body: Record<string, any>) {
  const $set: Record<string, any> = {};
  const $unset: Record<string, 1> = {};
  for (const field of EDITABLE_FIELDS) {
    if (!(field in body)) continue;
    const value = body[field];
    const clearable = [...OPTIONAL_REF_FIELDS, ...OPTIONAL_DATE_FIELDS, ...OPTIONAL_TEXT_FIELDS].includes(field);
    if (clearable && isEmpty(value)) {
      $unset[field] = 1;
    } else if (!isEmpty(value) || field === 'description') {
      $set[field] = value;
    }
  }
  return { $set, $unset };
}

/** Returns an error message if a referenced id is malformed or not owned by the user. */
async function validateRefs(set: Record<string, any>, userId?: string): Promise<string | null> {
  for (const f of ['projectId', ...OPTIONAL_REF_FIELDS]) {
    if (set[f] !== undefined && !mongoose.isValidObjectId(set[f])) return `Invalid ${f}`;
  }
  if (set.projectId && !(await Project.exists({ _id: set.projectId, userId }))) return 'Project not found';
  if (set.epicId && !(await Epic.exists({ _id: set.epicId, userId }))) return 'Epic not found';
  if (set.sprintId && !(await Sprint.exists({ _id: set.sprintId, userId }))) return 'Sprint not found';
  if (set.parentTicketId && !(await Ticket.exists({ _id: set.parentTicketId, userId }))) return 'Parent ticket not found';
  return null;
}

/** Next free "QA-n" — based on the highest existing number so deletions never cause duplicates. */
async function nextTicketNo(userId?: string): Promise<string> {
  const docs = await Ticket.find({ userId }).select('ticketNo').lean();
  let max = 0;
  for (const d of docs) {
    const m = /^QA-(\d+)$/.exec(d.ticketNo || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `QA-${max + 1}`;
}

const asText = (v: unknown): string => {
  if (v === undefined || v === null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object' && (v as any)._id) return String((v as any)._id);
  return String(v);
};

async function resolveNames(ids: string[]): Promise<Record<string, string>> {
  const valid = ids.filter((i) => mongoose.isValidObjectId(i));
  if (!valid.length) return {};
  const [epics, sprints] = await Promise.all([
    Epic.find({ _id: { $in: valid } }).select('name').lean(),
    Sprint.find({ _id: { $in: valid } }).select('name').lean(),
  ]);
  const map: Record<string, string> = {};
  [...epics, ...sprints].forEach((d: any) => { map[String(d._id)] = d.name; });
  return map;
}

/** Diffs the tracked fields of two tickets into activity log entries. */
async function diffTicket(before: any, after: any, userId?: string) {
  const raw: { field: string; from: string; to: string }[] = [];
  for (const field of Object.keys(TRACKED_FIELDS)) {
    const from = asText(before[field]);
    const to = asText(after[field]);
    if (from !== to) raw.push({ field, from, to });
  }
  const names = await resolveNames(raw.flatMap((r) => (['epicId', 'sprintId'].includes(r.field) ? [r.from, r.to] : [])));
  return raw.map(({ field, from, to }) => {
    const isRef = ['epicId', 'sprintId'].includes(field);
    return {
      action: `${TRACKED_FIELDS[field]} changed`,
      field,
      oldValue: isRef ? names[from] || from : from,
      newValue: isRef ? names[to] || to : to,
      userId,
      createdAt: new Date(),
    };
  });
}

// ---------------------------------------------------------------- handlers

export const getTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const filter: any = { userId: req.userId };
    for (const key of ['projectId', 'epicId', 'sprintId', 'parentTicketId']) {
      if (q[key]) {
        if (!mongoose.isValidObjectId(q[key])) { res.status(400).json({ message: `Invalid ${key}` }); return; }
        filter[key] = q[key];
      }
    }
    for (const key of ['status', 'priority', 'environment', 'type', 'severity']) {
      if (q[key]) filter[key] = { $in: q[key]!.split(',') };
    }
    if (q.isFavorite === 'true') filter.isFavorite = true;
    if (q.search) {
      const rx = new RegExp(escapeRegex(q.search.trim()), 'i');
      filter.$or = [{ ticketNo: rx }, { title: rx }, { description: rx }];
    }
    if (q.labels) filter.labels = { $in: q.labels.split(',') };

    let sortOption: any = { updatedAt: -1 };
    if (q.sort === 'createdAt') sortOption = { createdAt: -1 };
    else if (q.sort === 'dueDate') sortOption = { reminderDate: 1 };

    const tickets = await populateTicket(Ticket.find(filter).sort(sortOption));
    if (q.sort === 'priority') {
      tickets.sort((a: any, b: any) => (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0));
    }
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { $set } = buildChanges(req.body || {});
    if (!$set.title || !String($set.title).trim()) { res.status(400).json({ message: 'Title is required' }); return; }
    if (!$set.projectId) { res.status(400).json({ message: 'Project is required' }); return; }
    const refError = await validateRefs($set, req.userId);
    if (refError) { res.status(400).json({ message: refError }); return; }

    const ticketNo = await nextTicketNo(req.userId);
    const created = await Ticket.create({
      ...$set,
      ticketNo,
      userId: req.userId,
      ...(CLOSED_STATUSES.includes($set.status) ? { closedDate: new Date() } : {}),
      activityLogs: [{ action: 'Ticket created', userId: req.userId, createdAt: new Date() }],
    });
    res.status(201).json(await loadPopulated(String(created._id), req.userId));
  } catch (err: any) {
    const status = err?.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};

export const getTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(String(req.params.id))) { res.status(404).json({ message: 'Ticket not found' }); return; }
    const ticket = await loadPopulated(String(req.params.id), req.userId);
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(String(req.params.id))) { res.status(404).json({ message: 'Ticket not found' }); return; }
    const before = await Ticket.findOne({ _id: String(req.params.id), userId: req.userId }).lean();
    if (!before) { res.status(404).json({ message: 'Ticket not found' }); return; }

    const { $set, $unset } = buildChanges(req.body || {});
    if ('title' in (req.body || {}) && !String(req.body.title ?? '').trim()) {
      res.status(400).json({ message: 'Title cannot be empty' });
      return;
    }
    const refError = await validateRefs($set, req.userId);
    if (refError) { res.status(400).json({ message: refError }); return; }

    if ($set.status) {
      if (CLOSED_STATUSES.includes($set.status) && !CLOSED_STATUSES.includes(before.status)) $set.closedDate = new Date();
      if (!CLOSED_STATUSES.includes($set.status) && CLOSED_STATUSES.includes(before.status)) $unset.closedDate = 1;
    }

    const update: any = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;
    if (!Object.keys(update).length) {
      res.json(await loadPopulated(String(req.params.id), req.userId));
      return;
    }

    const after = await Ticket.findOneAndUpdate({ _id: String(req.params.id), userId: req.userId }, update, {
      new: true,
      runValidators: true,
    }).lean();

    const changes = await diffTicket(before, after, req.userId);
    if (changes.length) {
      await Ticket.updateOne({ _id: String(req.params.id) }, { $push: { activityLogs: { $each: changes } } });
    }
    res.json(await loadPopulated(String(req.params.id), req.userId));
  } catch (err: any) {
    const status = err?.name === 'ValidationError' || err?.name === 'CastError' ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOneAndDelete({ _id: String(req.params.id), userId: req.userId });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    // sub-tasks keep existing, just detach them
    await Ticket.updateMany({ parentTicketId: ticket._id, userId: req.userId }, { $unset: { parentTicketId: 1 } });
    // remove uploaded files that belonged to the ticket
    for (const file of ticket.attachments || []) removeUploadedFile(file);
    res.json({ message: 'Ticket deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({ _id: String(req.params.id), userId: req.userId }).select('isFavorite');
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    await Ticket.updateOne({ _id: ticket._id }, { $set: { isFavorite: !ticket.isFavorite } });
    res.json(await loadPopulated(String(req.params.id), req.userId));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// -------- comments

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) { res.status(400).json({ message: 'Comment cannot be empty' }); return; }
    const result = await Ticket.updateOne(
      { _id: String(req.params.id), userId: req.userId },
      { $push: { comments: { text, userId: req.userId, createdAt: new Date() } } }
    );
    if (!result.matchedCount) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.json(await loadPopulated(String(req.params.id), req.userId));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await Ticket.updateOne(
      { _id: String(req.params.id), userId: req.userId },
      { $pull: { comments: { _id: req.params.commentId } } }
    );
    if (!result.matchedCount) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.json(await loadPopulated(String(req.params.id), req.userId));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// -------- checklist

export const addChecklistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) { res.status(400).json({ message: 'Checklist item cannot be empty' }); return; }
    const result = await Ticket.updateOne(
      { _id: String(req.params.id), userId: req.userId },
      { $push: { checklist: { text, completed: false } } }
    );
    if (!result.matchedCount) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.json(await loadPopulated(String(req.params.id), req.userId));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleChecklistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({ _id: String(req.params.id), userId: req.userId });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    const item = (ticket.checklist as any).id(req.params.itemId);
    if (!item) { res.status(404).json({ message: 'Checklist item not found' }); return; }
    item.completed = typeof req.body?.completed === 'boolean' ? req.body.completed : !item.completed;
    await ticket.save({ validateModifiedOnly: true });
    res.json(await loadPopulated(String(req.params.id), req.userId));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteChecklistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await Ticket.updateOne(
      { _id: String(req.params.id), userId: req.userId },
      { $pull: { checklist: { _id: req.params.itemId } } }
    );
    if (!result.matchedCount) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.json(await loadPopulated(String(req.params.id), req.userId));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// -------- attachments

function removeUploadedFile(filename: string) {
  const target = path.join(config.uploadDir, path.basename(filename));
  fs.promises.unlink(target).catch(() => undefined);
}

export const addAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ message: 'No file uploaded' }); return; }
    const result = await Ticket.updateOne(
      { _id: String(req.params.id), userId: req.userId },
      { $push: { attachments: req.file.filename } }
    );
    if (!result.matchedCount) {
      removeUploadedFile(req.file.filename);
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }
    res.json(await loadPopulated(String(req.params.id), req.userId));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filename = path.basename(String(req.params.filename));
    const result = await Ticket.updateOne(
      { _id: String(req.params.id), userId: req.userId },
      { $pull: { attachments: filename } }
    );
    if (!result.matchedCount) { res.status(404).json({ message: 'Ticket not found' }); return; }
    removeUploadedFile(filename);
    res.json(await loadPopulated(String(req.params.id), req.userId));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
