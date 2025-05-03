// Update your Infractions schema file
import { model, Schema, Document, Model, Types } from 'mongoose';

// Define interface for individual infraction
export interface Infraction {
  IssuerID: string;
  IssuerTag: string;
  Reason: string;
  Date: number;
}

interface IUser extends Document {
  Guild: string;
  User: string;  // Changed from UserID to match your command code
  Infractions: Infraction[];
}

// Define schema for individual infraction
const infractionSchema = new Schema<Infraction>({
	IssuerID: { type: String, required: true },
	IssuerTag: { type: String, required: true },
	Reason: { type: String, required: true },
	Date: { type: Number, required: true }
});

// Main schema
const infractionsSchema = new Schema<IUser>({
	Guild: { type: String, required: true },
	User: { type: String, required: true },  // Changed to match your command code
	Infractions: { type: [infractionSchema], required: true }
});

const InfractionLogger = model<IUser>('infractions', infractionsSchema);

export default InfractionLogger;