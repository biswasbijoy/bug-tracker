import { Router } from 'express';
import { getLabels, createLabel, updateLabel, deleteLabel } from '../controllers/labelController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getLabels);
router.post('/', createLabel);
router.put('/:id', updateLabel);
router.delete('/:id', deleteLabel);

export default router;
