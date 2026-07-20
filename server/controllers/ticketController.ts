import { Response } from 'express';
import { Ticket } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { userId: req.userId };
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.epicId) filter.epicId = req.query.epicId;
    if (req.query.sprintId) filter.sprintId = req.query.sprintId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.environment) filter.environment = req.query.environment;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.isFavorite === 'true') filter.isFavorite = true;
    if (req.query.search) {
      const search = req.query.search as string;
      filter.$or = [
        { ticketNo: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }
    if (req.query.labels) {
      const labels = (req.query.labels as string).split(',');
      filter.labels = { $in: labels };
    }

    let sortOption: any = { updatedAt: -1 };
    if (req.query.sort) {
      const sortStr = req.query.sort as string;
      if (sortStr === 'priority') sortOption = { priority: -1 };
      else if (sortStr === 'createdAt') sortOption = { createdAt: -1 };
      else if (sortStr === 'dueDate') sortOption = { reminderDate: 1 };
    }

    const tickets = await Ticket.find(filter)
      .populate('projectId', 'name color')
      .populate('epicId', 'name')
      .populate('sprintId', 'name')
      .sort(sortOption);

    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Ticket.countDocuments({ userId: req.userId });
    const ticketNo = `QA-${count + 1}`;
    const ticket = await Ticket.create({ ...req.body, ticketNo, userId: req.userId });
    res.status(201).json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.userId })
      .populate('projectId', 'name color')
      .populate('epicId', 'name')
      .populate('sprintId', 'name');
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const oldTicket = await Ticket.findOne({ _id: req.params.id, userId: req.userId });
    if (!oldTicket) { res.status(404).json({ message: 'Ticket not found' }); return; }

    const updateData = { ...req.body };
    if (req.body.status === 'closed' && oldTicket.status !== 'closed') {
      updateData.closedDate = new Date();
    }

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updateData },
      { new: true }
    );

    const changes: any[] = [];
    if (oldTicket.status !== ticket!.status) {
      changes.push({
        action: 'Status changed',
        field: 'status',
        oldValue: oldTicket.status,
        newValue: ticket!.status,
        userId: req.userId,
        createdAt: new Date(),
      });
    }
    if (changes.length > 0) {
      await Ticket.updateOne(
        { _id: req.params.id },
        { $push: { activityLogs: { $each: changes } } }
      );
    }

    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    res.json({ message: 'Ticket deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.userId });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    ticket.isFavorite = !ticket.isFavorite;
    await ticket.save();
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.userId });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    ticket.comments.push({ text: req.body.text, userId: req.userId as any, createdAt: new Date() });
    await ticket.save();
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const addChecklistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.userId });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    ticket.checklist.push({ text: req.body.text, completed: false });
    await ticket.save();
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleChecklistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.userId });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    const checklist = ticket.checklist as any;
    const item = checklist.id(req.params.itemId);
    if (!item) { res.status(404).json({ message: 'Checklist item not found' }); return; }
    item.completed = !item.completed;
    await ticket.save();
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteChecklistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.userId });
    if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
    const checklist = ticket.checklist as any;
    checklist.pull({ _id: req.params.itemId });
    await ticket.save();
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
