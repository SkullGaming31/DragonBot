declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DISCORD_GUILD_ID: string;
			DISCORD_BOT_TOKEN: string;
			DISCORD_CLIENT_ID: string;
			DISCORD_CLIENT_SECRET: string;
			DEV_GUILD_ID: string;
			DEV_DISCORD_BOT_TOKEN: string;
			DEV_DISCORD_CLIENT_ID: string;
			DEV_DISCORD_CLIENT_SECRET: string;
			DEV_DISCORD_REDIRECT_URL: string;
			DBD_LICENCE: string;
			Enviroment: 'dev' | 'prod' | 'debug';
			PORT: number;
			MONGO_USERNAME: string;
			MONGO_PASSWORD: string;
			MONGODB_DATABASE: string;
			MONGO_DATABASE_URI: string;
			GOOGLE_API_KEY: string;
		}
	}
}

export { };