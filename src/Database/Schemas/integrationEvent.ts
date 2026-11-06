import mongoose, { Document, Schema, model } from 'mongoose';

export interface IIntegrationEvent extends Document {
	eventId: string;
	provider?: string;
	createdAt: Date;
	status?: 'processing' | 'failed' | 'complete';
	leaseToken?: string | null;
	leaseUntil?: Date | null;
	deliveredConfigIds?: string[];
}

const ttlSeconds = Number(process.env.INTEGRATION_EVENT_TTL_SEC ?? '86400'); // default 1 day

const integrationEventSchema = new Schema<IIntegrationEvent>({
	eventId: { type: String, required: true, unique: true },
	provider: { type: String, default: null },
	status: { type: String, enum: ['processing', 'failed', 'complete'] },
	leaseToken: { type: String, default: null },
	leaseUntil: { type: Date, default: null },
	deliveredConfigIds: { type: [String], default: [] },
	createdAt: { type: Date, default: Date.now }
});

// TTL index on createdAt to expire old events automatically
integrationEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttlSeconds });

const IntegrationEventModel = (mongoose.models.IntegrationEvent as mongoose.Model<IIntegrationEvent>) || model<IIntegrationEvent>('IntegrationEvent', integrationEventSchema);

export default IntegrationEventModel;
