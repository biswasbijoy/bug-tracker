import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

const signToken = (userId: string) =>
  jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

const publicUser = (user: any) => ({
  id: String(user._id),
  email: user.email,
  name: user.name,
  role: user.role,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body || {};
    if (!name || !String(name).trim()) { res.status(400).json({ message: 'Name is required' }); return; }
    if (!email || !EMAIL_RE.test(String(email))) { res.status(400).json({ message: 'A valid email is required' }); return; }
    if (!password || String(password).length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashed, name });
    res.status(201).json({ token: signToken(String(user._id)), user: publicUser(user) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body || {};
    const user = email ? await User.findOne({ email: String(email).toLowerCase().trim() }) : null;
    if (!user || !password || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    res.json({ token: signToken(String(user._id)), user: publicUser(user) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(publicUser(user));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) { res.status(400).json({ message: 'Name is required' }); return; }
    const user = await User.findByIdAndUpdate(req.userId, { name }, { new: true }).select('-password');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json(publicUser(user));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters' });
      return;
    }
    const user = await User.findById(req.userId);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
