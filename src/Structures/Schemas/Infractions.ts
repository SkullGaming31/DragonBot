import { model, Schema } from 'mongoose';

interface User {
	Guild: string,
	UserID: string,
	Infractions: object[]
}

const infractionsSchema = new Schema<User>({
	Guild: { type: String, required: true },
	UserID: { type: String, required: false },
	Infractions: { type: [Object], required: true }
});

const infractionLogger = model<User>('infractions', infractionsSchema);
export default infractionLogger;