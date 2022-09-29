import { model, Schema } from 'mongoose';

interface Logs {
	Guild: string,
	Channel: string
}

const logsSchema = new Schema<Logs>({
	Guild: { type: String, required: true },
	Channel: { type: String, required: false },
});

const ChanLogger = model<Logs>('loggerchannel', logsSchema);
export default ChanLogger;