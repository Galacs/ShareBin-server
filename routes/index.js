import express from 'express';

import authLocal from './auth/local.js';

const router = express.Router();

router.use('/auth/local', authLocal);

export default router;
