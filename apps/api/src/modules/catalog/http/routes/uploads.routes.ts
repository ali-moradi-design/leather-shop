import { Router } from 'express';
import { authenticate, requireAnyPermission } from '@modules/identity/http/middleware';
import { bookCoverUpload } from '@shared/http/middleware/upload';
import * as ctrl from '../controllers/uploads.controller';

const router = Router();

router.post(
  '/book-cover',
  authenticate,
  requireAnyPermission('books:create', 'books:update'),
  bookCoverUpload.single('file'),
  ctrl.uploadBookCover,
);

export default router;
