import startApi from './Api';
import { ExtendedClient } from './Structures/Client';
import { config } from 'dotenv';

config();

export const client = new ExtendedClient();

client.start();

startApi();