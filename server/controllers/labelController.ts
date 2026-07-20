import { Response } from 'express';
import { Label } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getLabels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const labels = await Label.find({ userId: req.userId }).sort({ name: 1 });
    res.json(labels);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createLabel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const label = await Label.create({ ...req.body, userId: req.userId });
    res.status(201).json(label);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateLabel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const label = await Label.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!label) { res.status(404).json({ message: 'Label not found' }); return; }
    res.json(label);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteLabel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const label = await Label.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!label) { res.status(404).json({ message: 'Label not found' }); return; }
    res.json({ message: 'Label deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
