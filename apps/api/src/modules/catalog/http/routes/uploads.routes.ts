import { Router } from 'express';
import { authenticate, requireAnyPermission } from '@modules/identity/http/middleware';
import { productCoverUpload } from '@shared/http/middleware/upload';
import * as ctrl from '../controllers/uploads.controller';

const router = Router();

router.post(
  '/product-cover',
  authenticate,
  requireAnyPermission('products:create', 'products:update'),
  productCoverUpload.single('file'),
  ctrl.uploadProductCover,
);

export default router;
