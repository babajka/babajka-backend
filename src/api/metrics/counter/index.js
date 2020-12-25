import { Router } from 'express';

import Counter from './model';

import * as controller from './controller';

const router = Router();

router.get('/:key', controller.get);

export { Counter };
export default router;
