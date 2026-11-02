import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// UPLOAD_DIR is resolved relative to the server folder (default: <repo>/uploads)
const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket-tracker',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir,
};
