import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import * as controller from './controller';
import LocalizedArticle from './model';

const router = Router();

router.post('/:articleId', requireAuth, verifyPermission('canCreateArticle'), controller.create);
router.put('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.update);

export { LocalizedArticle };
export default router;
