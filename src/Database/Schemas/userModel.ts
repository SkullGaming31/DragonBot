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

// Compound index to speed up lookups by guild+user and ensure single document per user per guild
userSchema.index({ guildID: 1, id: 1 }, { unique: true });

// Ensure balances are stored as integers to avoid floating point artifacts
userSchema.pre('save', function (this: Document & Partial<IUser>, next) {
	try {
		if (typeof this.balance === 'number') {
			// Floor to avoid giving fractional remainders to users
			this.balance = Math.floor(this.balance);
		}
		if (typeof this.bank === 'number') {
			this.bank = Math.floor(this.bank);
		}
	} catch {
		// swallow errors to avoid blocking saves; logging is left to callers
	}
	next();
});

// After findOneAndUpdate (and similar), make sure the returned doc's balance/bank are integers
// and persist the rounded values back to the database if needed.
userSchema.post('findOneAndUpdate', async (doc: Document & Partial<IUser> | null) => {
	try {
		if (!doc) return;
		let changed = false;
		if (typeof doc.balance === 'number' && !Number.isInteger(doc.balance)) {
			doc.balance = Math.floor(doc.balance);
			changed = true;
		}
		if (typeof doc.bank === 'number' && !Number.isInteger(doc.bank)) {
			doc.bank = Math.floor(doc.bank);
			changed = true;
		}
		if (changed) {
			// Persist the rounded values back to the DB
			try {
				// Attempt to access a model-like constructor from the document in a typed way
				const maybeCtor = (doc as unknown as { constructor?: unknown }).constructor;

				const ctor = maybeCtor as unknown as { findByIdAndUpdate?: (_: unknown, _u: Partial<IUser>) => Promise<unknown> } | undefined;
				const id = (doc as unknown as { _id?: unknown })._id;
				if (ctor?.findByIdAndUpdate && id !== undefined) {
					await ctor.findByIdAndUpdate(id, { balance: doc.balance, bank: doc.bank }).catch(() => undefined);
				}
			} catch {
				// ignore persistence failures
			}
		}
	} catch {
		// ignore
	}
});

export const UserModel = model<IUser>('Users', userSchema);