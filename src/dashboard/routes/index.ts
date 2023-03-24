import { Router } from 'express';
import homeRouter from './home';
import accountRouter from './account';
import discordAuthRouter from './auth';

const router = Router();

router.use('/', homeRouter);
router.use('/account', accountRouter);
router.use('/auth', discordAuthRouter);

export default router;