import { model, Schema } from 'mongoose';

interface Suggest {
	GuildID: string,
	MessageID: string,
	Details: Array<string>
}

const suggestSchema = new Schema<Suggest>({
	GuildID: { type: String, required: true },
	MessageID: { type: String, required: false },
	Details: { type: [String], required: false },
});

const DB = model<Suggest>('SuggestDB', suggestSchema);
export default DB;