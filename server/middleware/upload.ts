import multer from 'multer';
import path from 'path';
import { config } from '../config';

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.log', '.txt', '.csv', '.json', '.mp4', '.webm',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^\w.-]+/g, '_')
      .slice(0, 60);
    // "<unique>__<original name>" so the original name can be shown in the UI
    cb(null, `${uniqueSuffix}__${base}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, videos, text/log, CSV and JSON files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});
