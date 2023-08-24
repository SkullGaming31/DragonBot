import { Request, Response } from 'express';
import { ExtendedClient } from '../Structures/Client';

const healthListener = async (_req: Request, res: Response) => {
	/**
   * @todo check MongoDB connection
   * @todo check Discord connection
   * @todo check other ...
   */
	let isOK = true;

	//#region Discord API Check
	const client = new ExtendedClient();
	try {
		await client.login(process.env.DEV_DISCORD_BOT_TOKEN);
		if (!client.readyAt) {
			isOK = false;
		}
	} catch (error) {
		console.error(error);
		isOK = false;
	} finally {
		client.destroy();
	}
	//#endregion

	res.status(isOK ? 200 : 500).end();
};

export default healthListener;
