import { Response } from 'express';
import { Project } from '../models';
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
