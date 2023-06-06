import { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
  id: string;
  username: string;
  balance: number;
}

const userSchema = new Schema<IUser>({
	id: { type: String, required: true, unique: true },
	username: { type: String },
	balance: { type: Number }
});

export const UserModel = model<IUser>('Users', userSchema);