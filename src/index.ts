import startApi from './Api';
import { ExtendedClient } from './Structures/Client';
import { config } from 'dotenv';
import errorHandler from './Structures/errorHandler';

config();

export const client = new ExtendedClient();
client.start();

async function main() {
    await errorHandler(client);
    await startApi();
};

main();