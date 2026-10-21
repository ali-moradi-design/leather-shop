import { Router } from 'express';
import { authenticate, requirePermission } from '@modules/identity/http/middleware';
import { validate } from '@shared/http/middleware/validate';
import * as ctrl from '../controllers/cart.controller';
import {
  addCartItemSchema,
  updateCartItemSchema,
  productIdParamSchema,
  checkoutSchema,
} from '../validators/cart.validation';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.get);
router.post('/items', validate({ body: addCartItemSchema }), ctrl.addItem);
router.patch(
  '/items/:productId',
  validate({ params: productIdParamSchema, body: updateCartItemSchema }),
  ctrl.updateItem,
);
router.delete('/items/:productId', validate({ params: productIdParamSchema }), ctrl.removeItem);
router.delete('/', ctrl.clear);
router.post(
  '/checkout',
  requirePermission('orders:create'),
  validate({ body: checkoutSchema }),
  ctrl.checkout,
);

export default router;
