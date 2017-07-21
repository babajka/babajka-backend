import { Router } from 'express';

import * as controller from './controller';
import User from './model';

const router = Router();
router.get('/', controller.getAll);

export { User };
export default router;
