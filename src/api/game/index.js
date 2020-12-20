import { Router } from 'express';

import fortuneRoutes from './fortune';

const router = Router();

router.use('/fortune', fortuneRoutes);

export default router;
