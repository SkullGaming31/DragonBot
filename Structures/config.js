require('dotenv').config();

/**
 * @typedef EnvironmentConfiguration
 * @prop {string} DISCORD_BOT_TOKEN your discord bots Token
 * @prop {string} DISCORD_CLIENT_ID not used for anything atm
 * @prop {string} DISCORD_CLIENT_SECRET not used for anything atm
 * @prop {string} DISCORD_ERR_WEBHOOK_ID Webhook ID for the Error logging channel
 * @prop {string} DISCORD_ERR_WEBHOOK_TOKEN Webhook Token for the error logging channel
 * @prop {string} GOOGLE_API_KEY api key for accessing google apis
 * @prop {string} GITHUB_CLIENT_ID Client ID for the github app
 * @prop {string} GITHUB_CLIENT_SECRET Client Secret for the github app
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