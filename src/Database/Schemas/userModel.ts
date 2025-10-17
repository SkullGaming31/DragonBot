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

// Ensure balances are stored as integers to avoid floating point artifacts
userSchema.pre('save', function (next) {
	try {
		if (typeof (this as any).balance === 'number') {
			// Floor to avoid giving fractional remainders to users
			(this as any).balance = Math.floor((this as any).balance);
		}
		if (typeof (this as any).bank === 'number') {
			(this as any).bank = Math.floor((this as any).bank);
		}
	} catch (err) {
		// swallow errors to avoid blocking saves; logging is left to callers
	}
	next();
});

// After findOneAndUpdate (and similar), make sure the returned doc's balance/bank are integers
// and persist the rounded values back to the database if needed.
userSchema.post('findOneAndUpdate', async function (doc) {
	try {
		if (!doc) return;
		let changed = false;
		if (typeof (doc as any).balance === 'number' && !Number.isInteger((doc as any).balance)) {
			(doc as any).balance = Math.floor((doc as any).balance);
			changed = true;
		}
		if (typeof (doc as any).bank === 'number' && !Number.isInteger((doc as any).bank)) {
			(doc as any).bank = Math.floor((doc as any).bank);
			changed = true;
		}
		if (changed) {
			// Persist the rounded values back to the DB
			try {
				await (doc as any).constructor.findByIdAndUpdate((doc as any)._id, { balance: (doc as any).balance, bank: (doc as any).bank }).exec();
			} catch (e) {
				// ignore persistence failures
			}
		}
	} catch (e) {
		// ignore
	}
});

export const UserModel = model<IUser>('Users', userSchema);