import { Document, Model, Schema, model } from 'mongoose';

export interface IToken extends Document {
	discordId: string;
	accessToken: string;
	refreshToken: string;
	email?: string;
}

const tokenSchema = new Schema<IToken>({
	discordId: { type: String, required: true, unique: true },
	accessToken: { type: String },
	refreshToken: { type: String },
	email: { type: String },
});

export const TokenModel: Model<IToken> = model<IToken>('usertokens', tokenSchema);