import { Document, Schema, model } from 'mongoose';

export interface ISuggestion extends Document {
  guildId: string;
  messageId: string;
  details: SuggestionDetail[]; // Use the new IDetail interface
}

export interface SuggestionDetail {
  MemberID: string;
  Title: string;
  Name: string;
}

const suggestionSchema = new Schema<ISuggestion>({
	guildId: { type: String, required: true },
	messageId: { type: String, required: true },
	details: { type: [Object] as unknown as SuggestionDetail[], required: true },
});

const SuggestionModel = model<ISuggestion>('Suggestion', suggestionSchema);
export default SuggestionModel;