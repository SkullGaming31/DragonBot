import { Document, Schema, model } from 'mongoose';

interface IWarn extends Document {
	GuildID: string;
	UserID: string;
	Warnings: {
		WarningID: string; // Unique ID for each warning
		Reason: string;
		Source: string;
	}[];
}

const warningSchema = new Schema<IWarn>({
	GuildID: { type: String, required: true },
	UserID: { type: String, required: true },
	Warnings: {
		type: [
			{
				WarningID: { type: String, required: true }, // Unique ID for each warning
				Reason: { type: String, required: true },
				Source: { type: String, required: true }
			},
		],
		required: false,
		default: [],
	},
});

const WarningDB = model<IWarn>('WarningDB', warningSchema);
export default WarningDB;