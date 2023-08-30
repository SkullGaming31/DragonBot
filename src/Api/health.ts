import { User } from 'discord.js';
import { config } from 'dotenv';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ExtendedClient } from '../Structures/Client';
config();

const healthListener = async (_req: Request, res: Response) => {
	let isOK = true;
	const discordBotToken = process.env.DISCORD_BOT_TOKEN;
	const userIDsToNotify = ['353674019943219204'];

	//#region MongoDB Check
	try {
		console.log(process.env.MONGO_DATABASE_URI);

		mongoose.connect(process.env.MONGO_DATABASE_URI as string);

		if (mongoose.connection.readyState !== 1) {
			isOK = false;
			notifyUsersViaDM(userIDsToNotify, 'MongoDB connection issue detected.');
		}

		await mongoose.disconnect();
	} catch (error) {
		console.error('MongoDB Error:', error);
		isOK = false;
		notifyUsersViaDM(userIDsToNotify, `MongoDB connection error: ${error}`);
	}
	//#endregion

	//#region Discord API Check
	const client = new ExtendedClient();
	try {
		await client.login(discordBotToken);
		if (!client.readyAt) {
			isOK = false;
			notifyUsersViaDM(userIDsToNotify, 'Discord API connection issue detected.');
		}
	} catch (error) {
		console.error('Discord Error:', error);
		isOK = false;
		notifyUsersViaDM(userIDsToNotify, `Discord API connection error: ${error}`);
	} finally {
		client.destroy();
	}
	//#endregion

	res.status(isOK ? 200 : 500).end();
};

const notifyUsersViaDM = (userIDs: string[], message: string) => {
	const client = new ExtendedClient();
	const discordBotToken = process.env.DISCORD_BOT_TOKEN;

	client.login(discordBotToken).then(async () => {
		for (const userID of userIDs) {
			try {
				const user = await client.users.fetch(userID) as User;
				if (user) {
					user.send(message);
				}
			} catch (error) {
				console.error(`Failed to send DM to user with ID ${userID}:`, error);
			}
		}
		client.destroy();
	});
};

export default healthListener;
