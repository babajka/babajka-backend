import { Router } from 'express';

import * as controller from './controller';
import Diary from './model';

const router = Router();

// :year might be added to the URL once we decide to distinguish them.
router.get('/:locale/:month/:day/', controller.getDay);

export { Diary };
export default router;
