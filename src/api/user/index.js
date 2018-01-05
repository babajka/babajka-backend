import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import * as controller from './controller';
import User, { checkPermissions, serializeUser } from './model';

const router = Router();
router.get('/', requireAuth, verifyPermission('canManageUsers'), controller.getAll);
router.get('/current', requireAuth, controller.getCurrent);

export { User, checkPermissions, serializeUser };
export default router;
