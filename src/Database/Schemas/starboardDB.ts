import { Schema, model, Document } from 'mongoose';

export interface IStarboardPost {
  originalMessageId: string;
  starboardMessageId: string;
  count: number;
}

export interface IStarboard extends Document {
  guildId: string;
  channelId?: string;
  emoji: string;
  threshold: number;
  ignoredChannels: string[];
  ignoredRoles: string[];
  ignoredUsers: string[];
  posts: IStarboardPost[];
}

const StarboardPostSchema = new Schema<IStarboardPost>({
  originalMessageId: { type: String, required: true },
  starboardMessageId: { type: String, required: true },
  count: { type: Number, required: true }
});

const StarboardSchema = new Schema<IStarboard>({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: false },
  emoji: { type: String, required: true, default: '⭐' },
  threshold: { type: Number, required: true, default: 3 },
  ignoredChannels: { type: [String], default: [] },
  ignoredRoles: { type: [String], default: [] },
  ignoredUsers: { type: [String], default: [] },
  posts: { type: [StarboardPostSchema], default: [] }
});

export default model<IStarboard>('starboard', StarboardSchema);
