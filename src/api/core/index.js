import { Router } from 'express';
import multer from 'multer';

import { requireAuth } from 'auth';

import * as controller from './controller';

const upload = multer();

const router = Router();

router.get('/uploads', requireAuth, controller.getUploads);
router.post('/uploads', requireAuth, upload.single('image'), controller.upload);

export default router;
