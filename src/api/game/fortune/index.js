import { Router } from 'express';

import { requireAuth, verifyPermission, allowTokenAuth } from 'auth';
import { requireFields } from 'utils/validation';

import * as controller from './controller';

const router = Router();

router.get('/:slug', controller.getOne);
router.get('/getCookie/:slug', controller.getCookie);
router.post(
  '/fibery/import',
  allowTokenAuth,
  requireAuth,
  verifyPermission('canManageArticles'),
  requireFields('fiberyPublicId'),
  controller.fiberyImport
);

export default router;
