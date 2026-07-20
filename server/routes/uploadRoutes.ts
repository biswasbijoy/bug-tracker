import { Router } from 'express';
import { uploadFile, uploadMultiple } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.use(authenticate);

router.post('/', upload.single('file'), uploadFile);
router.post('/multiple', upload.array('files', 10), uploadMultiple);

export default router;
