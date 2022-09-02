declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_BOT_TOKEN: string;
      DEV_DISCORD_BOT_TOKEN: string;
      DEV_GUILD_ID: string;
      envirment: 'dev' | 'prod' | 'debug';
      DISCORD_CLIENT_ID: string;
      DISCORD_CLIENT_SECRET: string;
      DISCORD_GUILD_ID: string;
      DISCORD_LOGS_CHANNEL: string;
      DISCORD_NOW_LIVE_CHANNEL: string;
      DISCORD_SUPPORT_CHANNEL_ID: string;
      DISCORD_EVERYONE_ROLE_ID: string;
      DISCORD_TICKET_SYSTEM_ID: string;
      DISCORD_OPEN_TICKET_ID: string;
      DISCORD_TRANSCRIPT_ID: string;
      DISCORD_ADMIN_ROLE_ID: string;
      DISCORD_MODERATOR_ROLE_ID: string;
      DISCORD_ERR_WEBHOOK_ID: string;
      DISCORD_ERR_WEBHOOK_TOKEN: string;
      DISCORD_WELCOME_WEBHOOK_ID: string;
      DISCORD_WELCOME_WEBHOOK_TOKEN: string;
      MONGO_USERNAME: string;
      MONGO_PASSWORD: string;
      MONGODB_DATABASE: string;
      MONGO_DATABASE_URI: string;
      GOOGLE_API_KEY: string;
    }
  }
}

export { };