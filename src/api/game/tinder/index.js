import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';
import { requireFields } from 'utils/validation';

import * as controller from './controller';

const router = Router();

router.get('/:slug', controller.getOne);

router.post(
  '/fibery/import',
  requireAuth,
  verifyPermission('canManageArticles'),
  requireFields('fiberyPublicId'),
  controller.fiberyImport
);

export default router;
