import { Response } from 'express';
import { Project, Epic, Ticket } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await Project.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.create({ ...req.body, userId: req.userId });
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    res.json({ message: 'Project deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getProjectOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const project = await Project.findOne({ _id: id, userId });
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }

    const epicCount = await Epic.countDocuments({ projectId: id, userId });

    const [
      totalTickets,
      openTickets,
      closedTickets,
      blockedTickets,
      productionPending,
      ticketsDueToday,
      overdueTickets,
      recentlyUpdated,
    ] = await Promise.all([
      Ticket.countDocuments({ projectId: id, userId }),
      Ticket.countDocuments({ projectId: id, userId, status: { $nin: ['closed', 'cancelled'] } }),
      Ticket.countDocuments({ projectId: id, userId, status: 'closed' }),
      Ticket.countDocuments({ projectId: id, userId, status: 'blocked' }),
      Ticket.countDocuments({ projectId: id, userId, status: 'released', closedDate: { $exists: false } }),
      Ticket.countDocuments({
        projectId: id, userId,
        reminderDate: { $gte: new Date().setHours(0,0,0,0), $lte: new Date().setHours(23,59,59,999) },
        status: { $nin: ['closed', 'cancelled'] },
      }),
      Ticket.countDocuments({
        projectId: id, userId,
        reminderDate: { $lt: new Date().setHours(0,0,0,0) },
        status: { $nin: ['closed', 'cancelled'] },
      }),
      Ticket.find({ projectId: id, userId })
        .populate('epicId', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    res.json({
      project,
      epicCount,
      totalTickets,
      openTickets,
      closedTickets,
      blockedTickets,
      productionPending,
      ticketsDueToday,
      overdueTickets,
      completionPercentage: totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0,
      recentlyUpdated,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getProjectActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const tickets = await Ticket.find({ projectId: id, userId })
      .select('ticketNo title status activityLogs updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);

    const activity = tickets.flatMap(t =>
      (t.activityLogs || []).map(log => ({
        ticketNo: t.ticketNo,
        ticketTitle: t.title,
        ticketId: t._id,
        action: log.action,
        field: log.field,
        oldValue: log.oldValue,
        newValue: log.newValue,
        createdAt: log.createdAt,
      }))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 30);

    res.json(activity);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
