import { Response } from 'express';
import { Epic } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getEpics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { userId: req.userId };
    if (req.query.projectId) filter.projectId = req.query.projectId;
    const epics = await Epic.find(filter).sort({ createdAt: -1 });
    res.json(epics);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createEpic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const epic = await Epic.create({ ...req.body, userId: req.userId });
    res.status(201).json(epic);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getEpic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const epic = await Epic.findOne({ _id: req.params.id, userId: req.userId });
    if (!epic) { res.status(404).json({ message: 'Epic not found' }); return; }
    res.json(epic);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEpic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const epic = await Epic.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!epic) { res.status(404).json({ message: 'Epic not found' }); return; }
    res.json(epic);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEpic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const epic = await Epic.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!epic) { res.status(404).json({ message: 'Epic not found' }); return; }
    res.json({ message: 'Epic deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
