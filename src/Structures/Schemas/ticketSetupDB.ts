import { model, Schema } from 'mongoose';

interface Tickets {
	GuildID: string,
	Channel: string,
	Category: string,
	Transcripts: string,
	Handlers: string,
	Everyone: string,
	BotRole: string,
	Description: string,
	Color: string,
	Buttons: [string],
}

const ticketSchema = new Schema<Tickets>({
	GuildID: { type: String, required: true },
	Channel: { type: String, required: false },
	Category: { type: String, required: false },
	Transcripts: { type: String, required: false },
	Handlers: { type: String, required: false },
	Everyone: { type: String, required: false },
	BotRole: { type: String, required: false },
	Description: { type: String, required: false },
	Color: { type: String, required: false },
	Buttons: { type: [String], required: false }
});

const ticketSetup = model<Tickets>('tickets', ticketSchema);
export default ticketSetup;