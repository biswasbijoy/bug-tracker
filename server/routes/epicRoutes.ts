import { Router } from 'express';
import { getEpics, createEpic, getEpic, updateEpic, deleteEpic } from '../controllers/epicController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getEpics);
router.post('/', createEpic);
router.get('/:id', getEpic);
router.put('/:id', updateEpic);
router.delete('/:id', deleteEpic);

export default router;
