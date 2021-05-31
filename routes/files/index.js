import express from 'express';

import upload from './upload.js';
import download from './download.js';

const router = express.Router();

router.use('/upload', upload);
router.use('/download', download);

export default router;
