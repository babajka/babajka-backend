import { Router } from 'express';

import { precheck } from 'utils/validation';

import * as controller from './controller';

const router = Router();

router.post('/', precheck.mailRequest, controller.updateEmailAddressStatus);

export default router;
