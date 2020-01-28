import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import * as controller from './controller';
import Diary from './model';

const router = Router();

// :year might be added to the URL once we decide to distinguish them.
router.get('/get/:month/:day/', controller.getDay);
router.get('/getBySlug/:slug/', controller.getBySlug);
router.get(
  '/fibery/import',
  requireAuth,
  verifyPermission('canEditDiaries'),
  controller.fiberyImport
);

export { Diary };
export default router;
