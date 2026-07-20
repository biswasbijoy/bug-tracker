import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    res.json({ filename: req.file.filename, path: req.file.path, size: req.file.size });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const uploadMultiple = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }
    res.json(files.map(f => ({ filename: f.filename, path: f.path, size: f.size })));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
