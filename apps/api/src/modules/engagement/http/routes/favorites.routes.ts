import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '@modules/identity/http/middleware';
import { validate } from '@shared/http/middleware/validate';
import * as ctrl from '../controllers/favorites.controller';
import { addFavoriteSchema, productIdParamSchema } from '../validators/favorites.validation';

const router = Router();
// Visitors get an empty list instead of a 401, so the heart on every product
// page can ask without logging errors; writes still need a session.
router.get('/', optionalAuthenticate, ctrl.list);
router.post('/', authenticate, validate({ body: addFavoriteSchema }), ctrl.add);
router.delete('/:productId', authenticate, validate({ params: productIdParamSchema }), ctrl.remove);

export default router;
