import { model, Schema } from 'mongoose';

interface Logs {
	Guild: string,
	enableLogs: boolean,
	Channel: string,
}

const logsSchema = new Schema<Logs>({
	Guild: { type: String, required: true },
	enableLogs: { type: Boolean, required: false },
	Channel: { type: String, required: false },
});

const ChanLogger = model<Logs>('loggerchannel', logsSchema);
export default ChanLogger;