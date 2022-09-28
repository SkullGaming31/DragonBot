import { model, Schema } from 'mongoose';

interface gLogs {
  Guild: String,
  MemberRole: Boolean,
  MemberNick: Boolean,
  ChannelTopic: Boolean,
  MemberBoost: Boolean,
  RoleStatus: Boolean,
  ChannelStatus: Boolean,
  EmojiStatus: Boolean,
  MemberBan: Boolean,
  MessageUpdates: Boolean
}

const genlogsSchema = new Schema<gLogs>({
  Guild: { type: String, required: true },
  MemberRole: { type: Boolean, required: false },
  MemberNick: { type: Boolean, required: false },
  ChannelTopic: { type: Boolean, required: false },
  MemberBoost: { type: Boolean, required: false },
  RoleStatus: { type: Boolean, required: false },
  ChannelStatus: { type: Boolean, required: false },
  EmojiStatus: { type: Boolean, required: false },
  MemberBan: { type: Boolean, required: false },
  MessageUpdates: { type: Boolean, required: false }
});

const GenLogs = model<gLogs>('generallogs', genlogsSchema);
export default GenLogs;