import { model, Schema, Document } from 'mongoose';

export interface Ticket extends Document {
  GuildID: string;
  MembersID?: string[];
  ChannelID?: string;
  TicketID?: string;
  Closed?: boolean;
  Locked?: boolean;
  Type?: string;
  Claimed?: boolean;
  ClaimedBy?: string;
}

const ticketSchema = new Schema<Ticket>({
  GuildID: { type: String, required: true },
  MembersID: { type: [String], required: false },
  ChannelID: { type: String, required: false },
  TicketID: { type: String, required: false },
  Closed: { type: Boolean, required: false },
  Locked: { type: Boolean, required: false },
  Type: { type: String, required: false },
  Claimed: { type: Boolean, required: false },
  ClaimedBy: { type: String, required: false }
});

const ticketModel = model<Ticket>('Ticket', ticketSchema);
export default ticketModel;