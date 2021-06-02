import express from 'express';

import deleteAccount from './delete.js';

const router = express.Router();

router.use('/', deleteAccount);

export default router;
