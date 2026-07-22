import { Router } from 'express';
import { getProjects, createProject, getProject, updateProject, deleteProject, getProjectOverview, getProjectActivity } from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/overview', getProjectOverview);
router.get('/:id/activity', getProjectActivity);

export default router;
