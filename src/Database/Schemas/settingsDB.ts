import { Document, Schema, model } from 'mongoose';

export interface ISettings extends Document {
	GuildID: string;
	AdministratorRole?: string;
	ModeratorRole?: string;
	MemberRole?: string;
	rulesChannel?: string;
	Welcome?: boolean;
	WelcomeChannel?: string;
	PromotionChannel?: string;
	punishmentChannel?: string;
	SuggestChan?: string;
	EconChan?: string;
	ModerationChannel?: string;
}

const settingsSchema = new Schema<ISettings>({
	GuildID: { type: String, required: true, unique: true },
	AdministratorRole: { type: String, default: null },
	ModeratorRole: { type: String, default: null },
	MemberRole: { type: String, default: null },
	rulesChannel: { type: String, default: null },
	Welcome: { type: Boolean, default: false },
	WelcomeChannel: { type: String, default: null },
	PromotionChannel: { type: String, default: null },
	punishmentChannel: { type: String, default: null },
	SuggestChan: { type: String, default: null },
	EconChan: { type: String, default: null },
	ModerationChannel: { type: String, default: null }
});

const SettingsModel = model<ISettings>('Settings', settingsSchema);

export default SettingsModel;
