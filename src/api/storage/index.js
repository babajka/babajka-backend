import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import { precheck } from 'utils/validation';

import * as controller from './controller';

const router = Router();

router.get('/main-page', controller.getMainPage);

router.post(
  '/main-page',
  requireAuth,
  verifyPermission('canManageArticles'),
  precheck.setMainPage,
  controller.setMainPage
);

export default router;
