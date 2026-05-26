import { Document, Schema, model } from 'mongoose';

export interface IBirthday extends Document {
	guildID: string;
	userID: string;
	month: number; // 1-12
	day: number; // 1-31
	year?: number | null;
	createdAt: Date;
}

const birthdaySchema = new Schema<IBirthday>({
	guildID: { type: String, required: true },
	userID: { type: String, required: true },
	month: { type: Number, required: true },
	day: { type: Number, required: true },
	year: { type: Number, default: null },
	createdAt: { type: Date, default: () => new Date() }
});

birthdaySchema.index({ guildID: 1, userID: 1 }, { unique: true });

const BirthdayModel = model<IBirthday>('Birthday', birthdaySchema);

export default BirthdayModel;
