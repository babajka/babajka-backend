import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import * as controller from './controller';

const router = Router();

router.get('/', requireAuth, verifyPermission('canManageArticles'), controller.getAll);

export default router;
