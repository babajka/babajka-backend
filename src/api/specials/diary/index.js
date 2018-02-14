import { Router } from 'express';

import * as controller from './controller';
import Diary from './model';

const router = Router();

router.get('/:year/:month/:day/', controller.getDay);

export { Diary };
export default router;
