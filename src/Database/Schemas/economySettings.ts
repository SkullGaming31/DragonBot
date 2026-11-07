import { Schema, model } from 'mongoose';

export interface EconomySettings {
	guildId: string;
	enabled: boolean;
	disabledCommands: string[];
}

const economySettingsSchema = new Schema<EconomySettings>({
	guildId: { type: String, required: true, unique: true },
	enabled: { type: Boolean, default: true },
	disabledCommands: { type: [String], default: [] }
});

export default model<EconomySettings>('EconomySettings', economySettingsSchema, 'economysettings');
