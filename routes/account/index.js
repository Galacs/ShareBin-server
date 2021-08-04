import express from 'express';

import deleteAccount from './delete.js';
import files from './files.js';

const router = express.Router();

router.use('/', deleteAccount);
router.use('/files', files);

export default router;
