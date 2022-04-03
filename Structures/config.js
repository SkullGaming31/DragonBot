require('dotenv').config();

/**
 * @typedef EnvironmentConfiguration
 * @prop {string} DISCORD_BOT_TOKEN your discord bots Token
 * @prop {string} DISCORD_CLIENT_ID not used for anything atm
 * @prop {string} DISCORD_CLIENT_SECRET not used for anything atm
 * @prop {string} DISCORD_GUILD_ID ID of your discord server
 * @prop {string} DISCORD_LOGS_CHANNEL_ID Channel ID for your Logs Channel
 * @prop {string} DISCORD_NOW_LIVE_CHANNEL the channel id for you Promotion channel
 * @prop {string} DISCORD_SUPPORT_CHANNEL_ID Support Channel ID 
 * @prop {string} DISCORD_EVERYONE_ROLE_ID Everyone Role ID
 * @prop {string} DISCORD_TICKET_SYSTEM_ID ticket system Parent Channel ID
 * @prop {string} DISCORD_OPEN_TICKET_ID Open Ticket Channel ID
 * @prop {string} DISCORD_TRANSCRIPT_ID Transcript Channel ID
 * @prop {string} DISCORD_BOT_ROLE_ID Discord Bot Role ID
 * @prop {string} DISCORD_ADMIN_ROLE_ID your Admin Roles ID
 * @prop {string} DISCORD_MOD_ROLE_ID your Moderator Roles ID
 * @prop {string} MONGO_USERNAME MONGO USERNAME
 * @prop {string} MONGO_PASSWORD MONGO PASSWORD
 * @prop {string} MONGO_DATABASE MONGO DATABASE NAME
 * @prop {string} MONGO_DATABASE_URI MONGO DATABASE URI
 */

/**
 * @type {EnvironmentConfiguration}
 */

const config = {
	...process.env,
};

module.exports = config;