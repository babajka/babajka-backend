import { Router } from 'express';

import fortuneRoutes from './fortune';
import tinderRoutes from './tinder';

const router = Router();

router.use('/fortune', fortuneRoutes);
router.use('/tinder', tinderRoutes);

export default router;
