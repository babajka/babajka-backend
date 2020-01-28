// TODO: remove

import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import ArticleCollection from 'api/article/collection/model';
import * as controller from './controller';

const router = Router();

router.get('/', controller.getAll);
router.get('/:slug', controller.getOne);
router.post('/', requireAuth, verifyPermission('canCreateArticle'), controller.create);
router.put('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.update);
router.delete('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.remove);

export { ArticleCollection };
export default router;
