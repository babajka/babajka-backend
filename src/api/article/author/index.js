import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import * as controller from './controller';

const router = Router();

router.get('/', controller.getAll);
router.post('/', requireAuth, verifyPermission('canCreateArticle'), controller.create);

export default router;
