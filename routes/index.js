import express from 'express';

import authLocal from './auth/local.js';
import account from './account.js';
import upload from './upload/upload.js';
import download from './download/download.js';

const router = express.Router();

router.use('/auth/local', authLocal);
router.use('/account', account);
router.use('/upload', upload);
router.use('/download', download);

export default router;
