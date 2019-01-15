import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import { precheck } from 'utils/validation';

import * as controller from './controller';

const router = Router();

router.get('/mainPage', controller.getMainPage);

router.post(
  '/mainPage',
  requireAuth,
  verifyPermission('canManageArticles'),
  precheck.setMainPage,
  controller.setMainPage
);

export default router;
