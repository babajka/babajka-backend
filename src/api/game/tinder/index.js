import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';
import { requireFields } from 'utils/validation';

import * as controller from './controller';

const router = Router();

router.get('/:slug', controller.getOne);

router.post('/stats', requireFields('action', 'personId', 'slug'), controller.stats);

router.get('/stats/:slug', requireAuth, verifyPermission('canManageArticles'), controller.getStats);

router.post(
  '/fibery/import',
  requireAuth,
  verifyPermission('canManageArticles'),
  requireFields('fiberyPublicId'),
  controller.fiberyImport
);

export default router;
