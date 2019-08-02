import { Router } from 'express';

import userRoutes from 'api/user';
// FIXME
import articleRoutes from 'api/article/new-index';
import coreRoutes from 'api/core';
import mailRoutes from 'api/mail';
import specialsRoutes from 'api/specials';
import storageRoutes from 'api/storage';
import tagRoutes from 'api/tag';
import topicRoutes from 'api/topic';

const router = Router();

router.use('/articles', articleRoutes);
router.use('/core', coreRoutes);
router.use('/mail', mailRoutes);
router.use('/specials', specialsRoutes);
router.use('/storage', storageRoutes);
router.use('/tags', tagRoutes);
router.use('/topics', topicRoutes);
router.use('/users', userRoutes);

export default router;
