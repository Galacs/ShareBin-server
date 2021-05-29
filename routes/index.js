import express from 'express';

import authLocal from './auth/local.js';
import account from './account.js';
import upload from './upload/upload.js';

const router = express.Router();

router.use('/auth/local', authLocal);
router.use('/account', account);
router.use('/upload', upload);

export default router;
