import { NextFunction, Response, Router } from 'express';
import {
  getTickets, createTicket, getTicket, updateTicket, deleteTicket,
  toggleFavorite, addComment, deleteComment,
  addChecklistItem, toggleChecklistItem, deleteChecklistItem,
  addAttachment, deleteAttachment,
} from '../controllers/ticketController';
import { authenticate, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.use(authenticate);

// turns multer errors (bad type / too large) into 400 responses instead of 500
const singleFile = (req: AuthRequest, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ message: err.message });
      return;
    }
    next();
  });
};

router.get('/', getTickets);
router.post('/', createTicket);
router.get('/:id', getTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.patch('/:id/favorite', toggleFavorite);
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);
router.post('/:id/checklist', addChecklistItem);
router.patch('/:id/checklist/:itemId', toggleChecklistItem);
router.delete('/:id/checklist/:itemId', deleteChecklistItem);
router.post('/:id/attachments', singleFile, addAttachment);
router.delete('/:id/attachments/:filename', deleteAttachment);

export default router;
