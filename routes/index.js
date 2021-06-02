import express from 'express';

import authLocal from './auth/local.js';
import account from './account/index.js';
import files from './files/index.js';

const router = express.Router();

router.use('/auth/local', authLocal);
router.use('/account', account);
router.use('/files', files);
export default router;
