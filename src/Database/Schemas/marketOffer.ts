import { Document, Schema, model } from 'mongoose';

export interface IOffer extends Document {
	listingID: string;
	buyerID: string;
	// price may be numeric (gold) or string (item name for barter)
	price: number | string;
	quantity: number;
	status: 'pending' | 'accepted' | 'declined' | 'expired';
	createdAt: Date;
	expiresAt: Date;
}

const offerSchema = new Schema<IOffer>({
	listingID: { type: String, required: true },
	buyerID: { type: String, required: true },
	price: { type: Schema.Types.Mixed, required: true },
	quantity: { type: Number, required: true, default: 1 },
	status: { type: String, required: true, default: 'pending' },
	createdAt: { type: Date, default: () => new Date() },
	expiresAt: { type: Date, required: true }
});

// TTL index: remove the document after the `expiresAt` time passes
offerSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OfferModel = model<IOffer>('MarketOffers', offerSchema);
