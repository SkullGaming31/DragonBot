import { Schema, model, Document } from 'mongoose';

// Interface for Roulette document
interface Roulette extends Document {
	GuildID: string;
	bulletCount: number;
	streak: number;
	jackpot: number;
}

const rouletteSchema = new Schema({
	GuildID: { type: String, required: true },
	bulletCount: { type: Number, default: 1 },
	streak: { type: Number, default: 0 },
	jackpot: { type: Number, default: 0 }
});

const RouletteModel = model<Roulette>('roulettes', rouletteSchema);

export default RouletteModel;