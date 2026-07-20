import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';

const signToken = (userId: string) =>
  jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashed, name });
    const token = signToken(String(user._id));
    res.status(201).json({
      token,
      user: { id: String(user._id), email: user.email, name: user.name, role: user.role },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const token = signToken(String(user._id));
    res.json({
      token,
      user: { id: String(user._id), email: user.email, name: user.name, role: user.role },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
