import { model, Schema } from 'mongoose';

interface Settings {
	GuildID: string;
	LoggingChannel?: string;
	AdministratorRole?: string;
	ModeratorRole?: string;
	Welcome?: boolean;
	MemberRole: boolean;
	MemberNick: boolean;
	ChannelTopic: boolean;
	MemberBoost: boolean;
	RoleStatus: boolean;
	ChannelStatus: boolean;
	EmojiStatus: boolean;
	MemberBan: boolean;
	MessageUpdates: boolean;
	WelcomeChannel?: string;
	PromotionChannel?: string;
}

const settingsSchema = new Schema<Settings>({
	GuildID: { type: String, required: true, unique: true },
	LoggingChannel: { type: String, required: false },
	AdministratorRole: { type: String, required: false },
	ModeratorRole: { type: String, required: false },
	Welcome: { type: Boolean, required: false, default: false },
	MemberRole: { type: Boolean, required: false },
	MemberNick: { type: Boolean, required: false },
	ChannelTopic: { type: Boolean, required: false },
	MemberBoost: { type: Boolean, required: false },
	RoleStatus: { type: Boolean, required: false },
	ChannelStatus: { type: Boolean, required: false },
	EmojiStatus: { type: Boolean, required: false },
	MemberBan: { type: Boolean, required: false },
	MessageUpdates: { type: Boolean, required: false },
	WelcomeChannel: { type: String, required: false },
	PromotionChannel: { type: String, required: false }
});

const settings = model<Settings>('settings', settingsSchema);
export default settings;