import { Document, Schema, model } from 'mongoose';

interface ISettings extends Document {
	GuildID: string;
	AdministratorRole?: string;
	ModeratorRole?: string;
	MemberRole: string;
	rulesChannel: string;
	Welcome?: boolean;
	WelcomeChannel?: string;
	PromotionChannel?: string;
	punishmentChannel?: string;
	SuggestChan?: string;
	EconChan?: string;
	ModerationChannel: string;
}

const settingsSchema = new Schema<ISettings>({
	GuildID: { type: String, required: true, unique: true },
	AdministratorRole: { type: String },
	ModeratorRole: { type: String },
	MemberRole: { type: String },
	rulesChannel: { type: String },
	Welcome: { type: Boolean, default: false },
	WelcomeChannel: { type: String },
	PromotionChannel: { type: String },
	punishmentChannel: { type: String },
	SuggestChan: { type: String },
	EconChan: { type: String },
	ModerationChannel: { type: String }
});

const SettingsModel = model<ISettings>('Settings', settingsSchema);

export default SettingsModel;
