import { Router } from 'express';

import userRoutes from 'api/user';
import articleRoutes from 'api/article';
import specialsRoutes from 'api/specials';

const router = Router();

router.use('/users', userRoutes);
router.use('/articles', articleRoutes);
router.use('/specials', specialsRoutes);

export default router;
