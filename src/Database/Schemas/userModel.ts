import { PresenceStatusData } from 'discord.js';
import { Document, Schema, model } from 'mongoose';

export interface IUser extends Document {
    guildID: string;
    id: string;
    username: string;
    balance: number;
    inventory: string[]
    cooldowns?: {
        daily?: number;
        beg?: number;
        work?: number;
    };
    AFKmessage: string;
    AFKstatus: PresenceStatusData | null;
}

const userSchema = new Schema<IUser>({
	guildID: { type: String, required: true },
	id: { type: String, required: true },
	username: { type: String, required: true },
	balance: { type: Number, default: 0 },
	inventory: { type: [String], default: [] },
	cooldowns: {
		daily: { type: Number, default: 0 },
		beg: { type: Number, default: 0 },
		work: { type: Number, default: 0 }
	},
	AFKmessage: { type: String },
	AFKstatus: { type: String, enum: ['online', 'idle', 'dnd', 'invisible', null] } // Use enum to enforce valid status values
});

export const UserModel = model<IUser>('Users', userSchema);