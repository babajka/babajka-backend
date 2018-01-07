import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import * as controller from './controller';
import ArticleCollection from './model';

const router = Router();

router.get('/', controller.getAll);
router.get('/:slug', controller.getOne);
router.post('/', requireAuth, verifyPermission('canCreateArticle'), controller.create);
router.put('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.update);
router.delete('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.remove);

export { ArticleCollection };
export default router;
