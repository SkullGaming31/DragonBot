import { PresenceStatusData } from 'discord.js';
import { Document, Schema, model } from 'mongoose';

export interface IUser extends Document {
	guildID: string;
	id: string;
	username: string;
	balance: number;
	bank?: number;
	inventory: string[]
	cooldowns?: {
		daily?: number;
		beg?: number;
		work?: number;
		dig?: number;
	};
	AFKmessage: string;
	AFKstatus: PresenceStatusData | null;
	houseCooldown: Date | null;
	policeAlertLevel: number
	storeCooldown: Date | null;
	lastRewardTime: number;
}

const userSchema = new Schema<IUser>({
	guildID: { type: String, required: true },
	id: { type: String, required: true },
	username: { type: String },
	balance: { type: Number, default: 0 },
	bank: { type: Number, default: 0 },
	inventory: { type: [String], default: [] },
	cooldowns: {
		daily: { type: Number, default: 0 },
		beg: { type: Number, default: 0 },
		work: { type: Number, default: 0 },
		dig: { type: Number, default: 0 }
	},
	AFKmessage: { type: String },
	AFKstatus: { type: String, enum: ['online', 'idle', 'dnd', 'invisible', null] }, // Use enum to enforce valid status values
	houseCooldown: { type: Date, default: null },
	policeAlertLevel: { type: Number, default: 0 },
	storeCooldown: { type: Date, default: null },
	lastRewardTime: { type: Number, default: 0 }
});

export const UserModel = model<IUser>('Users', userSchema);