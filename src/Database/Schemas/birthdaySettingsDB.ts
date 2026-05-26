import { Document, Schema, model } from 'mongoose';

export interface IBirthdaySettings extends Document {
	GuildID: string;
	ChannelID?: string | null;
}

const settingsSchema = new Schema<IBirthdaySettings>({
	GuildID: { type: String, required: true, unique: true },
	ChannelID: { type: String, default: null }
});

const BirthdaySettingsModel = model<IBirthdaySettings>('BirthdaySettings', settingsSchema);

export default BirthdaySettingsModel;
