import { Router } from 'express';

import fortuneRoutes from './fortune';
import tinderRoutes from './tinder';
import xyRoutes from './xy';

const router = Router();

router.use('/fortune', fortuneRoutes);
router.use('/tinder', tinderRoutes);
router.use('/xy', xyRoutes);

export default router;
