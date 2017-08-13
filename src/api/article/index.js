import { Router } from 'express';

import { requireAuth } from 'auth';
import * as controller from './controllers';
import Article, { ArticleType } from './models';

const router = Router();
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

router.post('/', requireAuth, controller.create);

router.put('/:id', requireAuth, controller.update);

router.delete('/:id', requireAuth, controller.remove);

export { Article, ArticleType };
export default router;
