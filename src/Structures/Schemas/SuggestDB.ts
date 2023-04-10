import { model, Schema, Document } from 'mongoose';

export interface ISuggestion extends Document {
  guildId: string;
  messageId?: string;
  details?: object[];
}

const suggestionSchema = new Schema<ISuggestion>({
	guildId: { type: String, required: true },
	messageId: { type: String, required: false },
	details: { type: [Object], required: false },
});

const SuggestionModel = model<ISuggestion>('Suggestion', suggestionSchema);
export default SuggestionModel;