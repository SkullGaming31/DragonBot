import { Document, Schema, model } from 'mongoose';

export interface IIntegrationConfig extends Document {
  GuildID: string;
  provider: string;
  enabled: boolean;
  channelId?: string;
  template?: string;
  rateLimitWindowSec?: number;
}

const integrationConfigSchema = new Schema<IIntegrationConfig>({
	GuildID: { type: String, required: true, unique: false },
	provider: { type: String, required: true },
	enabled: { type: Boolean, default: true },
	channelId: { type: String, default: null },
	template: { type: String, default: null },
	rateLimitWindowSec: { type: Number, default: 60 }
});

const IntegrationConfigModel = model<IIntegrationConfig>('IntegrationConfig', integrationConfigSchema);

export default IntegrationConfigModel;
