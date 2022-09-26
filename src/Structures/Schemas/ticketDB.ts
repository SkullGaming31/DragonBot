import { model, Schema } from 'mongoose';

interface Tickets {
  GuildID: string,
  MembersID: [string],
  ChannelID: string,
  TicketID: string,
  Closed: boolean,
  Locked: boolean,
  Type: string,
  Claimed: boolean,
  ClaimedBy: string
}

const ticketsSchema = new Schema<Tickets>({
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

const DB = model<Tickets>('ticket', ticketsSchema);
export default DB;