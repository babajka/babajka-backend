import { Router } from 'express';

import { requireAuth, allowRoles } from 'auth';
import * as controller from './controller';
import Article from './article.model';
import ArticleType from './type.model';

const router = Router();
router.get('/', controller.getAll);
router.post('/', requireAuth, allowRoles(['admin', 'creator']), controller.create);
router.get('/:slug', controller.getOne);
router.put('/:slug', requireAuth, allowRoles(['admin', 'creator']), controller.update);
router.delete('/:slug', requireAuth, allowRoles(['admin', 'creator']), controller.remove);

export { Article, ArticleType };
export default router;
