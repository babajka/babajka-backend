import { Router } from 'express';

import userRoutes from 'api/user';
import articleRoutes from 'api/article';
import coreRoutes from 'api/core';
import specialsRoutes from 'api/specials';
import storageRoutes from 'api/storage';
import tagRoutes from 'api/tag';

const router = Router();

router.use('/articles', articleRoutes);
router.use('/core', coreRoutes);
router.use('/specials', specialsRoutes);
router.use('/storage', storageRoutes);
router.use('/tags', tagRoutes);
router.use('/users', userRoutes);

export default router;
