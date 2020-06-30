import { Router } from 'express';

import * as controller from './controller';

const router = Router();

router.get('/:slug', controller.getOne);

export default router;
