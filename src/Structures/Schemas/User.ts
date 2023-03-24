import { model, Schema } from 'mongoose';

interface User {
  discordId: string;
  accessToken: string;
  refreshToken: string;
  email: string;
}

const userSchema = new Schema<User>({
	discordId: { type: String, required: true, unique: true },
	accessToken: { type: String, required: false },
	refreshToken: { type: String, required: false },
	email: { type: String, required: false }
});

const users = model<User>('users', userSchema);
export default users;