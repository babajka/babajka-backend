import { Router } from 'express';

import Topic from './model';
import * as controller from './controller';

import { verifyTopicName } from './middlewares';

const router = Router();

router.get('/articles/:topic', verifyTopicName, controller.getArticles);

export { Topic };

export default router;
