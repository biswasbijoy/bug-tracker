import { Router } from 'express';
import { getSprints, createSprint, getSprint, updateSprint, deleteSprint } from '../controllers/sprintController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getSprints);
router.post('/', createSprint);
router.get('/:id', getSprint);
router.put('/:id', updateSprint);
router.delete('/:id', deleteSprint);

export default router;
