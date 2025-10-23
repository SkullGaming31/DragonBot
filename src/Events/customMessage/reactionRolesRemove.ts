
import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { Event } from '../../Structures/Event';
import ReactionRoleModel from '../../Database/Schemas/reactionRole';

function normalizeEmojiIdentifier(emoji: { id: string | null; name: string | null }) {
	if (emoji.id) return `${emoji.name}:${emoji.id}`;
	return emoji.name ?? '';
}

export default new Event<'messageReactionRemove'>('messageReactionRemove', async (reaction: MessageReaction | PartialMessageReaction, reactionUser: User | PartialUser) => {
	let messageReaction: MessageReaction;
	if (reaction.partial) {
		messageReaction = await reaction.fetch();
	} else {
		messageReaction = reaction;
	}

	const guild = messageReaction.message.guild;
	if (!guild) return;

	const member = await guild.members.fetch(reactionUser.id).catch(() => null);
	if (!member) return;

	const emojiId = normalizeEmojiIdentifier(messageReaction.emoji);

	const mappings = await ReactionRoleModel.find({ guildId: guild.id, messageId: messageReaction.message.id, emoji: emojiId }).lean();
	if (!mappings || mappings.length === 0) return;

	for (const map of mappings) {
		try {
			await member.roles.remove(map.roleId, 'reaction-role remove');
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Failed to remove reaction role', { err: (err as Error)?.message ?? err, guildId: guild.id, roleId: map.roleId });
		}
	}
});