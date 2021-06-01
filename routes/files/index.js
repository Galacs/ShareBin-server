import express from 'express';

import upload from './upload.js';
import download from './download.js';

const router = express.Router();

router.use('/', upload);
router.use('/', download);

export default router;
