import { Router } from 'express';

import userRoutes from 'api/user';
import coreRoutes from 'api/core';
import articleRoutes from 'api/article';
import specialsRoutes from 'api/specials';
import storageRoutes from 'api/storage';

const router = Router();

router.use('/articles', articleRoutes);
router.use('/core', coreRoutes);
router.use('/specials', specialsRoutes);
router.use('/storage', storageRoutes);
router.use('/users', userRoutes);

export default router;
