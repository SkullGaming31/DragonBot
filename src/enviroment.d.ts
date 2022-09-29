declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DISCORD_BOT_TOKEN: string;
			DEV_DISCORD_BOT_TOKEN: string;
			DEV_GUILD_ID: string;
			Enviroment: 'dev' | 'prod' | 'debug';
			DISCORD_CLIENT_ID: string;
			DISCORD_CLIENT_SECRET: string;
			DEV_DISCORD_CLIENT_ID: string;
			DEV_DISCORD_CLIENT_SECRET: string;
			DISCORD_GUILD_ID: string;
			MONGO_USERNAME: string;
			MONGO_PASSWORD: string;
			MONGODB_DATABASE: string;
			MONGO_DATABASE_URI: string;
			GOOGLE_API_KEY: string;
		}
	}
}

export { };