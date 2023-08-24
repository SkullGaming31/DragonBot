import { model, Schema, Document, Model } from 'mongoose';

interface IUser extends Document {
  Guild: string;
  UserID?: string;
  Infractions: object[];
}

const infractionsSchema = new Schema<IUser>({
	Guild: { type: String, required: true },
	UserID: { type: String, required: false },
	Infractions: { type: [Object], required: true },
});

const InfractionLogger: Model<IUser> = model<IUser>('infractions', infractionsSchema);

export default InfractionLogger;