import { Schema, model, Document } from 'mongoose';

export interface IAutoModRuleSettings {
  enabled: boolean;
  threshold?: number;
}

export interface IAutoMod extends Document {
  guildId: string;
  enabled: boolean;
  rules: {
    inviteLinks: IAutoModRuleSettings;
    caps: IAutoModRuleSettings;
    spam: IAutoModRuleSettings; // spam: messages in window
  };
  ignoredChannels: string[];
  ignoredRoles: string[];
  ignoredUsers: string[];
}

const AutoModSchema = new Schema<IAutoMod>({
	guildId: { type: String, required: true, unique: true },
	enabled: { type: Boolean, default: true },
	rules: {
		inviteLinks: { enabled: { type: Boolean, default: true }, threshold: { type: Number, default: 0 } },
		caps: { enabled: { type: Boolean, default: true }, threshold: { type: Number, default: 70 } },
		spam: { enabled: { type: Boolean, default: true }, threshold: { type: Number, default: 5 } },
	},
	ignoredChannels: { type: [String], default: [] },
	ignoredRoles: { type: [String], default: [] },
	ignoredUsers: { type: [String], default: [] },
});

export default model<IAutoMod>('automod', AutoModSchema);
