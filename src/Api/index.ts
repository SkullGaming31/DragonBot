import axios from 'axios';
import express, { Request, Response } from 'express';
import healthListener from './health';

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.static('public'));

app.get('/', async (req, res) => {
	res.sendFile('index.html', { root: './public' });
});
app.get('/discord', (req: Request, res: Response) => {
	const scopes: string[] = ['identify', 'guilds', 'applications.commands', 'bot', 'connections'];
	const joinedScopes: string = scopes.join('%20') as string;

	const discordRedirect = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=30092622032118&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fdiscord%2Fredirect&response_type=code&scope=${joinedScopes}`;
	res.redirect(discordRedirect);
});
app.get('/auth/discord/redirect', async (req: Request, res: Response) => {
	// Handle the Discord OAuth2 redirect here
	const { code } = req.query;

	if (code) {
		try {
			const tokenResponse = await axios.post(
				'https://discord.com/api/oauth2/token',
				new URLSearchParams({
					client_id: process.env.DISCORD_CLIENT_ID as string,
					client_secret: process.env.DISCORD_CLIENT_SECRET as string,
					code: code as string, // Explicitly cast code to string
					grant_type: 'authorization_code',
					redirect_uri: process.env.DEV_DISCORD_REDIRECT_URL as string,
					scope: 'identify guilds applications.commands bot',
				}).toString(),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			);

			const oauthData = tokenResponse.data;
			console.log('OauthData: ', oauthData);
		} catch (error) {
			// NOTE: An unauthorized token will not throw an error
			// tokenResponse.status will be 401
			console.error(error);
		}
	}

	// Respond to the redirect
	res.sendFile('index.html', { root: './public' });
});

app.get('/health', healthListener);

app.use((req: Request, res: Response) => {
	res.status(404).end();
});

const start = () => {
	app.listen(port, () => {
		console.log(`Server is running. http://localhost:${port}`);
	});
};

export default start;