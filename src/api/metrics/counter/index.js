import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import Counter from './model';

import * as controller from './controller';

const router = Router();

router.get('/:key', requireAuth, verifyPermission('canManageArticles'), controller.get);

export { Counter };
export default router;
