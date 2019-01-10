import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import * as controller from './controller';

const router = Router();

router.get('/public/:key', controller.getPublicDocument);

router.get(
  '/protected/:key',
  requireAuth,
  verifyPermission('canOperateOnStorage'),
  controller.getProtectedDocument
);

router.post(
  '/:accessPolicy/:key',
  requireAuth,
  verifyPermission('canOperateOnStorage'),
  controller.updateDocument
);

export default router;
