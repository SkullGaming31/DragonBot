import { model, Schema } from 'mongoose';

interface Warn {
	GuildID: string,
	UserID: string,
	UserTag: string,
	Content: [string]
}

const warningSchema = new Schema<Warn>({
	GuildID: { type: String, required: true },
	UserID: { type: String, required: false },
	UserTag: { type: String, required: false },
	Content: { type: [String], required: false },
});

const DB = model<Warn>('WarningDB', warningSchema);
export default DB;