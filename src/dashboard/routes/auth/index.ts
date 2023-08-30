import axios from 'axios';
import { Request, Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';

const discordAuthRouter = Router();

// discordAuthRouter.get('/discord', passport.authenticate('discord'), (req: Request, res: Response) => {
// 	res.sendStatus(200);
// });

// discordAuthRouter.get('/discord/redirect', passport.authenticate('discord'), (req: Request, res: Response) => {
// 	res.render('/account');
// });
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
});
discordAuthRouter.get('/discord', limiter, (req: Request, res: Response) => { // Discord Auth Landing
	// Redirect the user to the Discord authorization page with all scopes
	// res.json({ msg: 'Coming Soon' });
	res.redirect('https://discord.com/api/oauth2/authorize?client_id=930882181595807774&permissions=30092622032118&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fdiscord%2Fredirect&response_type=code&scope=identify%20guilds%20email%20connections');// 'identify', 'email', 'guilds', 'connections'
});
discordAuthRouter.get('/discord/redirect', limiter, async (req: Request, res: Response) => {
	const { code } = req.query;

	if (code) {
		try {
			const tokenResponse = await axios.post(
				'https://discord.com/api/oauth2/token',
				new URLSearchParams({
					client_id: process.env.DISCORD_CLIENT_ID as string,
					client_secret: process.env.DISCORD_CLIENT_SECRET as string,
					code: code as string,
					grant_type: 'authorization_code',
					redirect_uri: 'http://localhost:3001/api/auth/discord/redirect',
					scope: 'identify email connections guilds ',
				}).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			);

			const oauthData = tokenResponse.data;
			console.log(oauthData);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			// Handle unauthorized token
			if (error.response && error.response.status === 401) {
				console.error('Unauthorized token:', error.response.data);
				return res.status(401).send('Unauthorized token');
			}

			// Handle other errors
			console.error('Error exchanging token:', error);
			return res.status(500).send('Error exchanging token');
		}
	}
	res.render('/account');
});

discordAuthRouter.get('/status', (req: Request, res: Response) => {
	return req.user ? res.send(req.user) : res.sendStatus(401).send('Unauthorized');
});

export default discordAuthRouter;