import { model, Schema, Document } from 'mongoose';

interface IWarn extends Document {
  GuildID: string;
  UserID: string;
  Warnings: number;
  Reason?: string;
}

const warningSchema = new Schema<IWarn>({
	GuildID: { type: String, required: true },
	UserID: { type: String, required: true },
	Warnings: { type: Number, required: true },
	Reason: { type: String, required: false }
});

const WarningDB = model<IWarn>('WarningDB', warningSchema);
export default WarningDB;