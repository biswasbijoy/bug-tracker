import { Response } from 'express';
import { Sprint } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getSprints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { userId: req.userId };
    if (req.query.projectId) filter.projectId = req.query.projectId;
    const sprints = await Sprint.find(filter).sort({ createdAt: -1 });
    res.json(sprints);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createSprint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sprint = await Sprint.create({ ...req.body, userId: req.userId });
    res.status(201).json(sprint);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getSprint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sprint = await Sprint.findOne({ _id: req.params.id, userId: req.userId });
    if (!sprint) { res.status(404).json({ message: 'Sprint not found' }); return; }
    res.json(sprint);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSprint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!sprint) { res.status(404).json({ message: 'Sprint not found' }); return; }
    res.json(sprint);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSprint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sprint = await Sprint.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!sprint) { res.status(404).json({ message: 'Sprint not found' }); return; }
    res.json({ message: 'Sprint deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
