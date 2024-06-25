import { Router } from 'express';
import apiV1Routes from './apiv1';

const router = Router();

router.use('/api/v1', apiV1Routes);

export default router;