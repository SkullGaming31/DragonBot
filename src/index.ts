import startApi from './Api';
import { ExtendedClient } from './Structures/Client';
import { config } from 'dotenv';
import errorHandler from './Structures/errorHandler';
import checkVariables from './Structures/checkVariables';
import { createApp } from './dashboard/util/createApp';
// import connectDatabase from './Database';

config();

export const client = new ExtendedClient();
client.start();

async function main() {
	await errorHandler(client);
	// await connectDatabase();// issues with connecting to the database
	await startApi();
	checkVariables(process.env); // checks if any variable's values are missing in the .env
}

main();