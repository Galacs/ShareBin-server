import express from 'express';

import authLocal from './auth/local.js';
import account from './account.js';

const router = express.Router();

router.use('/auth/local', authLocal);
router.use('/account', account);

export default router;
