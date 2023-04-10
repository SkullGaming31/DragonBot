import { model, Schema, Document } from 'mongoose';

interface User extends Document {
  discordId: string;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
}

const userSchema = new Schema<User>({
	discordId: { type: String, required: true, unique: true },
	accessToken: { type: String },
	refreshToken: { type: String },
	email: { type: String },
});

const UserModel = model<User>('User', userSchema);

export default UserModel;