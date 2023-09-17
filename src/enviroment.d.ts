declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DISCORD_GUILD_ID: string;
			DISCORD_BOT_TOKEN: string;
			DISCORD_CLIENT_ID: string;
			DISCORD_CLIENT_SECRET: string;
			DISCORD_NOW_LIVE_CHANNEL: string;
			DEV_DISCORD_GUILD_ID: string;
			DEV_DISCORD_BOT_TOKEN: string;
			DEV_DISCORD_CLIENT_ID: string;
			DEV_DISCORD_CLIENT_SECRET: string;
			DEV_DISCORD_REDIRECT_URL: string;
			DEV_ERROR_LOGS_CHANNEL: string;
			DEV_NOW_LIVE_CHANNEL: string;
			DEV_DISCORD_ERR_WEBHOOK_ID: string;
			DEV_DISCORD_ERR_WEBHOOK_TOKEN: string;
			Enviroment: 'dev' | 'prod' | 'debug';
			PORT: number;
			MONGO_DATABASE_URI: string;
			DEV_MONGO_DATABASE_URI: string;
			DEV_MONGO_DATABASE_USERNAME: string;
			DEV_MONGO_DATABSE_PASSWORD: string;
			DEV_MONGO_DATABSE_NAME: string;
			SESSION_SECRET: string;
			OAUTH_CLIENT_ID: string;
			OAUTH_CLIENT_SECRET: string;
			OAUTH_REDIRECT_URL: string;
			DEV_DASHBOARD_DOMAIN: string;
			DASHBOARD_DOMAIN: string;
			GITHUB_PERSONAL_ACCESS_TOKEN: string;
			OPEN_API_KEY: string;
			CHATGPT_CHANNEL: string;
		}
	}
}

export { };
