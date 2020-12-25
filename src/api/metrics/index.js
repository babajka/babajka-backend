import { Router } from 'express';

import counterRoutes from './counter';

const router = Router();

router.use('/counter', counterRoutes);

export default router;
