import { ExtendedClient } from "./Structures/Client";

require('dotenv').config();

export const client = new ExtendedClient();

client.start();