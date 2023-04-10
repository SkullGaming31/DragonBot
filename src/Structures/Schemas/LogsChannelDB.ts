import { model, Schema, Document } from 'mongoose';

interface LogsDoc extends Document {
  Guild: string;
  enableLogs?: boolean;
  Channel?: string;
}

const logsSchema = new Schema<LogsDoc>({
	Guild: { type: String, required: true },
	enableLogs: { type: Boolean, required: false },
	Channel: { type: String, required: false },
});

const ChanLogger = model<LogsDoc>('loggerchannel', logsSchema);

export default ChanLogger;