import { Document, Schema, model } from 'mongoose';

export interface IReactionCleanup extends Document {
  Guild: string;
  lastRunAt?: Date;
  lastChecked?: number;
  lastRemoved?: number;
}

const reactionCleanupSchema = new Schema<IReactionCleanup>({
	Guild: { type: String, required: true, index: true },
	lastRunAt: { type: Date, required: false },
	lastChecked: { type: Number, required: false },
	lastRemoved: { type: Number, required: false },
});

const ReactionCleanupModel = model<IReactionCleanup>('reactionCleanup', reactionCleanupSchema);

export default ReactionCleanupModel;
