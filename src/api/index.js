import { Router } from 'express';

import userRoutes from 'api/user';
import articleRoutes from 'api/article';
import coreRoutes from 'api/core';
import mailRoutes from 'api/mail';
import specialsRoutes from 'api/specials';
import storageRoutes from 'api/storage';
import tagRoutes from 'api/tag';
import topicRoutes from 'api/topic';
import filesProxy from 'api/files';

const router = Router();

router.use('/articles', articleRoutes);
router.use('/core', coreRoutes);
router.use('/mail', mailRoutes);
router.use('/specials', specialsRoutes);
router.use('/storage', storageRoutes);
router.use('/tags', tagRoutes);
router.use('/topics', topicRoutes);
router.use('/users', userRoutes);
router.use('/files', filesProxy);

export default router;
