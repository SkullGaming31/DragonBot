import { Router, Request, Response } from 'express';
import axios from 'axios';

export const router = Router();

router.get('/health', async (req: Request, res: Response) => {
	try {
		const response = await axios.get('https://discord.com/api/v9/gateway');
		if (response.status === 200) {
			res.status(200).send('Discord API is healthy');
		} else {
			res.status(500).send('Discord API is not healthy');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error checking Discord API health');
	}
});

export default router;