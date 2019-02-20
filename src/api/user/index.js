import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import * as controller from './controller';
import User, { checkPermissions, serializeUser, getUserResponse } from './model';

const router = Router();
router.get('/', requireAuth, verifyPermission('canManageUsers'), controller.getAll);
router.get('/current', controller.getCurrent);

export { User, checkPermissions, serializeUser, getUserResponse };
export default router;
