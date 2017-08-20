import { Router } from 'express';

import { requireAuth, allowRoles } from 'auth';
import * as controller from './controllers';
import Article, { ArticleType } from './models';

const router = Router();
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

router.post('/', requireAuth, allowRoles(['admin', 'creator']), controller.create);

router.put('/:id', requireAuth, allowRoles(['admin', 'creator']), controller.update);

router.delete('/:id', requireAuth, allowRoles(['admin', 'creator']), controller.remove);

export { Article, ArticleType };
export default router;
