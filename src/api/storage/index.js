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

router.get('/sidebar', controller.getSidebar);

router.post(
  '/sidebar',
  requireAuth,
  verifyPermission('canManageArticles'),
  precheck.setSidebar,
  controller.setSidebar
);

router.post(
  '/fibery/main-page',
  requireAuth,
  verifyPermission('canManageArticles'),
  controller.fiberyMainPage
);

router.post(
  '/fibery/sidebar',
  requireAuth,
  verifyPermission('canManageArticles'),
  controller.fiberySidebar
);

export default router;
