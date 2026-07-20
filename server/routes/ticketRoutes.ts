import { Router } from 'express';
import {
  getTickets, createTicket, getTicket, updateTicket, deleteTicket,
  toggleFavorite, addComment, addChecklistItem, toggleChecklistItem, deleteChecklistItem,
} from '../controllers/ticketController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getTickets);
router.post('/', createTicket);
router.get('/:id', getTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.patch('/:id/favorite', toggleFavorite);
router.post('/:id/comments', addComment);
router.post('/:id/checklist', addChecklistItem);
router.patch('/:id/checklist/:itemId', toggleChecklistItem);
router.delete('/:id/checklist/:itemId', deleteChecklistItem);

export default router;
