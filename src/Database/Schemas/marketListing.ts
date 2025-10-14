import { Document, Schema, model } from 'mongoose';

export interface IListing extends Document {
  guildID: string;
  sellerID: string;
  itemName: string;
  price: number;
  quantity: number;
  active: boolean;
  createdAt: Date;
}

const listingSchema = new Schema<IListing>({
	guildID: { type: String, required: true },
	sellerID: { type: String, required: true },
	itemName: { type: String, required: true },
	price: { type: Number, required: true },
	quantity: { type: Number, required: true, default: 1 },
	active: { type: Boolean, default: true },
	createdAt: { type: Date, default: () => new Date() }
});

export const ListingModel = model<IListing>('Listings', listingSchema);
