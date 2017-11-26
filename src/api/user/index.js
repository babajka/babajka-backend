import { Router } from 'express';

import { requireAuth, allowRoles } from 'auth';

import * as controller from './controller';
import User, { checkRoles, serializeUser } from './model';

const router = Router();
router.get('/', requireAuth, allowRoles(['admin']), controller.getAll);
router.get('/current', requireAuth, controller.getCurrent);

export { User, checkRoles, serializeUser };
export default router;
