import { model, Schema } from 'mongoose';

interface Settings {
	GuildID: string,
	LoggingChannel: string,
	AdministratorRole: string,
	ModeratorRole: string,
	Welcome: boolean,
	WelcomeChannel: string,
	PromotionChannel: string
}

const settingsSchema = new Schema<Settings>({
	GuildID: { type: String, required: true },
	LoggingChannel: { type: String, required: false },
	AdministratorRole: { type: String, required: false },
	ModeratorRole: { type: String, required: false },
	Welcome: { type: Boolean, required: false },
	WelcomeChannel: { type: String, required: false },
	PromotionChannel: { type: String, required: false }
});

const settings = model<Settings>('settings', settingsSchema);
export default settings;