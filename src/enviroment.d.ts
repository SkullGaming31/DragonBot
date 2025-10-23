
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
			Enviroment: 'dev' | 'prod' | 'debug';
			PORT: number;
			MONGO_DATABASE_URI: string;
			DEV_MONGO_DATABASE_URI: string;
			DEV_MONGO_DATABASE_USERNAME: string;
			DEV_MONGO_DATABASE_PASSWORD: string;
			DEV_MONGO_DATABASE_NAME: string;
		}
	}
}

export { };
