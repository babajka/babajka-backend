import { Router } from 'express';

import userRoutes from 'api/user';
import articleRoutes from 'api/article';
import mailRoutes from 'api/mail';
import specialsRoutes from 'api/specials';
import storageRoutes from 'api/storage';

const router = Router();

router.use('/users', userRoutes);
router.use('/articles', articleRoutes);
router.use('/mail', mailRoutes);
router.use('/specials', specialsRoutes);
router.use('/storage', storageRoutes);

export default router;
