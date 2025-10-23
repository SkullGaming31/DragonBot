import mongoose from 'mongoose';

export interface IReactionRole {
  guildId: string;
  channelId: string;
  messageId: string;
  emoji: string; // unicode or custom emoji identifier (name:id for custom)
  roleId: string;
  label?: string;
}

const ReactionRoleSchema = new mongoose.Schema<IReactionRole>({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true, index: true },
  emoji: { type: String, required: true },
  roleId: { type: String, required: true },
  label: { type: String },
});

export default mongoose.models.ReactionRole || mongoose.model<IReactionRole>('ReactionRole', ReactionRoleSchema);
