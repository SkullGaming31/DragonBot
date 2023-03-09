import { model, Schema } from 'mongoose';

interface Warn {
	GuildID: string,
	UserID: string,
	Warnings: number,
	Reason: string
}

const warningSchema = new Schema<Warn>({
	GuildID: { type: String, required: true },
	UserID: { type: String, required: false },
	Warnings: { type: Number, required: false },
	Reason: { type: String, required: false }
});

const DB = model<Warn>('WarningDB', warningSchema);
export default DB;