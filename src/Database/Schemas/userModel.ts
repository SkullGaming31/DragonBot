import { Document, Schema, model } from 'mongoose';

export interface IUser extends Document {
	id: string;
	username: string;
	balance: number;
	inventory: string[]
	cooldowns?: {
		daily?: number;
		beg?: number;
		work?: number;
	};
}

const userSchema = new Schema<IUser>({
	id: { type: String, required: true, unique: true },
	username: { type: String },
	balance: { type: Number, default: 0 },
	inventory: { type: [String], default: [] },
	cooldowns: {
		daily: { type: Number, default: 0 },
		beg: { type: Number, default: 0 },
		work: { type: Number, default: 0 }
	},
});

export const UserModel = model<IUser>('Users', userSchema);