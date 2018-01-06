import { Router } from 'express';

import * as controller from './controller';
import ArticleBrand from './model';

const router = Router();

router.get('/', controller.getAll);

export { ArticleBrand };
export default router;
