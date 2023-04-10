import { model, Schema, Document } from 'mongoose';

interface ISettings extends Document {
  GuildID: string;
  AdministratorRole?: string;
  ModeratorRole?: string;
  Welcome?: boolean;
  WelcomeChannel?: string;
  PromotionChannel?: string;
  SuggestChan: string;
}

const settingsSchema = new Schema<ISettings>({
	GuildID: { type: String, required: true, unique: true },
	AdministratorRole: { type: String },
	ModeratorRole: { type: String },
	Welcome: { type: Boolean, default: false },
	WelcomeChannel: { type: String },
	PromotionChannel: { type: String },
	SuggestChan: { type: String },
});

const SettingsModel = model<ISettings>('Settings', settingsSchema);

export default SettingsModel;
