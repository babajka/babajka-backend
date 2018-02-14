import { Router } from 'express';

import diaryRoutes from './diary';

import Diary from './diary/model';

const router = Router();

router.use('/diary', diaryRoutes);

export { Diary };
export default router;
