import { Request, Response, Router } from 'express';
import passport from 'passport';

const discordAuthRouter = Router();

discordAuthRouter.get('/discord', passport.authenticate('discord'), (req: Request, res: Response) => {
	res.sendStatus(200);
});

discordAuthRouter.get('/discord/redirect', passport.authenticate('discord'), (req: Request, res: Response) => {
	res.render('/account');
});

discordAuthRouter.get('/status', (req: Request, res: Response) => {
	return req.user ? res.send(req.user) : res.sendStatus(401).send('Unauthorized');
});

export default discordAuthRouter;