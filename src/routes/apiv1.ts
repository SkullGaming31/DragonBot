import express, { Router, Request, Response, NextFunction } from 'express';
import { createIntegrationRouter, handleIntegrationWebhook } from '../Integrations/webhookHandler';
import type { ExtendedClient } from '../Structures/Client';

export const apiV1Routes = Router();

apiV1Routes.get('/', (req: Request, res: Response) => {
	res.send('Hello, world!');
});

// Minimal stats endpoint used by the dashboard
apiV1Routes.get('/stats', async (req: Request, res: Response) => {
	try {
		const mod = await import('../index');
		const client = (mod as unknown as { appInstance?: { client?: ExtendedClient } }).appInstance?.client;
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
		console.error(err);
	}
});

// Minimal commands endpoint for dashboard command listing
apiV1Routes.get('/commands', async (req: Request, res: Response) => {
	try {
		type CommandDescriptor = { name?: string; description?: string };
		const mod = await import('../index');
		const client = (mod as unknown as { appInstance?: { client?: ExtendedClient } }).appInstance?.client;
		const commands = Array.from((client?.commands?.values?.() ?? []) as unknown[]).map((c: unknown) => {
			const cmd = c as CommandDescriptor;
			return { name: cmd.name ?? 'unknown', description: cmd.description ?? '' };
		});
		res.json(commands);
	} catch (err) {
		res.status(500).json({ error: 'Unable to fetch commands' });
		console.error(err);
	}
});

// Generic integrations webhook receiver — delegate to handler dynamically to avoid circular imports
apiV1Routes.post('/integrations/webhook', express.json(), async (req: Request, res: Response, next: NextFunction) => {
	try {
		// call handler directly; it will attempt to dynamically load the client if needed
		await handleIntegrationWebhook(req, res);
	} catch (err) {
		next(err);
	}
});

export default apiV1Routes;