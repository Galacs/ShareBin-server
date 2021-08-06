import express from 'express';

import auth from './auth/index.js';
import account from './account/index.js';
import files from './files/index.js';

const router = express.Router();

router.use('/auth', auth);
router.use('/account', account);
router.use('/files', files);
export default router;
