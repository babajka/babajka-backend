import { Router } from 'express';

import { requireAuth, verifyPermission, allowTokenAuth } from 'auth';

import * as controller from './controller';

const router = Router();

router.get('/description/:slug', controller.getDescription);
router.get('/cookie/:slug', controller.getCookie);
router.get(
  '/fibery/import/:slug',
  allowTokenAuth,
  requireAuth,
  verifyPermission('canManageArticles'),
  controller.fiberyImport
);

export default router;
