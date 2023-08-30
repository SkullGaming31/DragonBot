import { Router } from 'express';
import accountRouter from './account';
import discordAuthRouter from './auth';
import homeRouter from './home';

const router = Router();

router.use('/', homeRouter);
router.use('/account', accountRouter);
router.use('/auth', discordAuthRouter);

export default router;