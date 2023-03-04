import { model, Schema } from 'mongoose';

interface Settings {
	GuildID: string;
	AdministratorRole?: string;
	ModeratorRole?: string;
	Welcome?: boolean;
	WelcomeChannel?: string;
	PromotionChannel?: string;
	SuggestChan: string;
}

const settingsSchema = new Schema<Settings>({
	GuildID: { type: String, required: true, unique: true },
	AdministratorRole: { type: String, required: false },
	ModeratorRole: { type: String, required: false },
	Welcome: { type: Boolean, required: false, default: false },
	WelcomeChannel: { type: String, required: false },
	PromotionChannel: { type: String, required: false },
	SuggestChan: { type: String, required: false }
});

const settings = model<Settings>('settings', settingsSchema);
export default settings;