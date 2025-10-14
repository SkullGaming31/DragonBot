import { Router, Request, Response } from 'express';
import { appInstance } from '../index';

export const apiV1Routes = Router();

apiV1Routes.get('/', (req: Request, res: Response) => {
	res.send('Hello, world!');
});

// Minimal stats endpoint used by the dashboard
apiV1Routes.get('/stats', (req: Request, res: Response) => {
	try {
		const client = appInstance?.client;
		const uptimeSeconds = process.uptime();
		const hours = Math.floor(uptimeSeconds / 3600);
		const minutes = Math.floor((uptimeSeconds % 3600) / 60);
		const seconds = Math.floor(uptimeSeconds % 60);
		res.json({
			uptime: `${hours}h ${minutes}m ${seconds}s`,
			ping: client?.ws?.ping ?? 0,
			guilds: client?.guilds.cache.size ?? 0
		});
	} catch (err) {
		res.status(500).json({ error: 'Unable to fetch stats' });
	}
});

// Minimal commands endpoint for dashboard command listing
apiV1Routes.get('/commands', (req: Request, res: Response) => {
	try {
		const commands = Array.from(appInstance.client.commands.values()).map((c: any) => ({ name: c.name, description: c.description }));
		res.json(commands);
	} catch (err) {
		res.status(500).json({ error: 'Unable to fetch commands' });
	}
});

export default apiV1Routes;