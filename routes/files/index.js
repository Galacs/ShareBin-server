import express from 'express';

import upload from './upload.js';
import deleteFile from './delete.js';
import download from './download.js';
import meta from './meta.js';

const router = express.Router();

router.use('/', upload);
router.use('/', deleteFile);
router.use('/', download);
router.use('/meta', meta);

export default router;
