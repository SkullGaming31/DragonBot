require('dotenv').config();

/**
 * @typedef EnvironmentConfiguration
 * @prop {string} DISCORD_BOT_TOKEN your discord bots Token
 * @prop {string} DISCORD_CLIENT_ID not used for anything atm
 * @prop {string} DISCORD_CLIENT_SECRET not used for anything atm
 * @prop {string} DISCORD_GUILD_ID ID of your discord server
 * @prop {string} DISCORD_PROMOTE_CHANNEL_ID the channel id for you Promotion channel
 * @prop {string} DISCORD_PROMOTE_CHANNEL_ID Channel id for your Promotion channel
 * @prop {string} DISCORD_NOW_LIVE_CHANNEL Channel Id where your members post there now live message
 * @prop {string} DISCORD_MODERATOR_ROLE_ID your Moderator Roles ID
 * @prop {string} DISCORD_ADMIN_ROLE_ID your Admin Roles ID
 * @prop {string} DISCORD_LOGS_CHANNEL_ID Channel ID for your Logs Channel
 * @prop {string} MONGODB_USERNAME Mongo DB Username
 * @prop {string} MONGODB_PASSWORD Mongo DB Password
 * @prop {string} MONGODB_DATABASE Mongo Database Name
 * @prop {string} MONGO_HOST Mongo Database Host
 * @prop {string} GITHUB_TOKEN the github token
 * @prop {string} PORT the port to listen on
 */

/**
 * @type {EnvironmentConfiguration}
 */

const config = {
	...process.env,
};

module.exports = config;