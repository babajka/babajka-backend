import { Router } from 'express';

import userRoutes from 'api/user';
import articleRoutes from 'api/article';
import specialsRoutes from 'api/specials';
import storageRoutes from 'api/storage';
import tagRoutes from 'api/tag';

const router = Router();

router.use('/users', userRoutes);
router.use('/articles', articleRoutes);
router.use('/specials', specialsRoutes);
router.use('/storage', storageRoutes);
router.use('/tags', tagRoutes);

export default router;
