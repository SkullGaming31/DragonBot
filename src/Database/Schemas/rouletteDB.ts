import { Schema, model, Document } from 'mongoose';

// Interface for Roulette document
interface Roulette extends Document {
    GuildID: string;
    bulletCount: number;
}

const rouletteSchema = new Schema({
	GuildID: { type: String, required: true },
	bulletCount: { type: Number, default: 1 }
});

const RouletteModel = model<Roulette>('roulettes', rouletteSchema);

export default RouletteModel;