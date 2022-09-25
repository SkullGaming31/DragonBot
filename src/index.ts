import startApi from './Api';
import { ExtendedClient } from './Structures/Client';

// require('dotenv').config();
import 'dotenv/config'

export const client = new ExtendedClient();

client.start();
startApi();
