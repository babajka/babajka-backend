import { Router } from 'express';

import Tag from './model';

import * as controller from './controller';

import { verifyTopicName } from './middlewares';

const router = Router();

// Current approach is that we fetch Tags from a Google spreadsheet,
// adding new topics or removing old (by performing diffs on slugs).
// Therefore there is no need to implement create/update endpoints right now.

router.get('/by-topic/:topic', verifyTopicName, controller.getByTopic);

router.get('/articles/:tag', controller.getArticles);

export default router;

export { Tag };
