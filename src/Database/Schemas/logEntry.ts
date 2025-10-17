import mongoose, { Document, Schema } from 'mongoose';

export interface LogEntryDocument extends Document {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const LogEntrySchema = new Schema<LogEntryDocument>({
	level: { type: String, required: true, enum: ['info', 'warn', 'error', 'debug'] },
	message: { type: String, required: true },
	meta: { type: Schema.Types.Mixed, required: false },
	createdAt: { type: Date, default: () => new Date() },
});

const modelName = 'LogEntry';
export default (mongoose.models[modelName] as mongoose.Model<LogEntryDocument>) || mongoose.model<LogEntryDocument>(modelName, LogEntrySchema);
