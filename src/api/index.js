import { Router } from 'express';

import userRoutes from 'api/user';
import articleRoutes from 'api/article';

const router = Router();

router.use('/users', userRoutes);
router.use('/articles', articleRoutes);

export default router;
