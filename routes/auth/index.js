import express from 'express';

import local from './local.js';
import refresh from './refresh.js';

const router = express.Router();

router.use('/local', local);
router.use('/refresh', refresh);

export default router;
