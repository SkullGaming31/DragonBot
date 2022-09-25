import startApi from './Api';
import { ExtendedClient } from './Structures/Client';
import { config } from 'dotenv';


export const client = new ExtendedClient();

config();
client.start();

startApi();
