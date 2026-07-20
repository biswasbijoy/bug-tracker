import { Router } from 'express';
import { getDashboard, getStats } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getDashboard);
router.get('/stats', getStats);

export default router;
