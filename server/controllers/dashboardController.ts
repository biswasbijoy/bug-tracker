import { Response } from 'express';
import { Ticket, Project } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalTickets,
      completedToday,
      pending,
      blocked,
      productionPending,
      readyForTesting,
      readyForDeploy,
      overdue,
      dueToday,
      recentlyUpdated,
    ] = await Promise.all([
      Ticket.countDocuments({ userId }),
      Ticket.countDocuments({ userId, updatedAt: { $gte: today, $lte: endOfDay }, status: 'closed' }),
      Ticket.countDocuments({ userId, status: { $nin: ['closed', 'cancelled'] } }),
      Ticket.countDocuments({ userId, status: 'blocked' }),
      Ticket.countDocuments({ userId, status: { $in: ['released'] }, closedDate: { $exists: false } }),
      Ticket.countDocuments({ userId, status: 'ready-for-qa' }),
      Ticket.countDocuments({ userId, status: 'ready-for-release' }),
      Ticket.countDocuments({
        userId,
        reminderDate: { $lt: today },
        status: { $nin: ['closed', 'cancelled'] },
      }),
      Ticket.countDocuments({
        userId,
        reminderDate: { $gte: today, $lte: endOfDay },
        status: { $nin: ['closed', 'cancelled'] },
      }),
      Ticket.find({ userId })
        .populate('projectId', 'name color')
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    res.json({
      totalTickets,
      completedToday,
      pending,
      blocked,
      productionPending,
      readyForTesting,
      readyForDeploy,
      overdue,
      dueToday,
      recentlyUpdated,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [thisWeek, thisMonth, byProject, byStatus] = await Promise.all([
      Ticket.countDocuments({ userId, createdAt: { $gte: startOfWeek } }),
      Ticket.countDocuments({ userId, createdAt: { $gte: startOfMonth } }),
      Ticket.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId!) } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
        { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$project.name', count: 1 } },
      ]),
      Ticket.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId!) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({ thisWeek, thisMonth, byProject, byStatus });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
