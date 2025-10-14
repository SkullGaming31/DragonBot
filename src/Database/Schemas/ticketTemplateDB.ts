import { model, Schema, Document } from 'mongoose';

export interface TicketTemplate extends Document {
  GuildID: string;
  Name: string;
  Type?: string; // optional ticket type this template applies to
  Title?: string;
  Description?: string;
  Buttons?: string[]; // array of button definitions like "Name,Emoji"
  IsDefault?: boolean;
}

const templateSchema = new Schema<TicketTemplate>({
	GuildID: { type: String, required: true },
	Name: { type: String, required: true },
	Type: { type: String, required: false },
	Title: { type: String, required: false },
	Description: { type: String, required: false },
	Buttons: { type: [String], required: false },
	IsDefault: { type: Boolean, required: false, default: false }
});

const templateModel = model<TicketTemplate>('TicketTemplate', templateSchema);
export default templateModel;
