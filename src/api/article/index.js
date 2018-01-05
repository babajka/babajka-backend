import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';
import * as controller from './controller';
import Article from './article.model';
import ArticleType from './type.model';

const router = Router();
router.get('/', controller.getAll);
router.get('/types', controller.getAllTypes);
router.post('/', requireAuth, verifyPermission('canCreateArticle'), controller.create);
router.get('/:slug', controller.getOne);
router.put('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.update);
router.delete('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.remove);

export { Article, ArticleType };
export default router;
