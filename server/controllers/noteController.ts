import { Response } from 'express';
import { Note } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.create({ ...req.body, userId: req.userId });
    res.status(201).json(note);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!note) { res.status(404).json({ message: 'Note not found' }); return; }
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!note) { res.status(404).json({ message: 'Note not found' }); return; }
    res.json({ message: 'Note deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
