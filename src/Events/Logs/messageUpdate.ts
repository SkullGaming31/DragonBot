import { ChannelType, EmbedBuilder, Message, PartialMessage, TextBasedChannel, User } from 'discord.js';

import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'messageUpdate'>('messageUpdate', async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
	if (!newMessage.inGuild()) return;
	const guild = newMessage.guild as NonNullable<typeof newMessage.guild>;
	const author = (newMessage as Message).author ?? undefined;
	const authorUser = author as User | undefined;
	const channel = newMessage.channel ?? undefined;
	if (authorUser?.bot) return;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (_err) {
		logError('messageUpdate: failed to read LogsChannelDB', { error: (_err as Error)?.message ?? _err });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	let logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) logsChannelOBJ = (await guild.channels.fetch(logsChannelID).catch(() => undefined)) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;
	if (channel.id === data.Channel) return;

	const oldContent = oldMessage.content ?? '';
	const newContent = newMessage.content ?? '';
	if (oldContent === newContent) return;

	const Count = 1950;
	const Original = oldContent.slice(0, Count) + (oldContent.length > Count ? ' ...' : '');
	const Edited = newContent.slice(0, Count) + (newContent.length > Count ? ' ...' : '');

	const log = new EmbedBuilder()
		.setColor('Yellow')
		.setDescription(`\ud83d\udcd8 A [message](${(newMessage as Message).url ?? 'unknown'}) by ${authorUser?.tag ?? 'unknown'} was **edited** in ${channel}.\\n\\n**Original**:\\n ${Original} \\n+**Edited**: \\n+ ${Edited}`)
		.setFooter({ text: `Member: ${authorUser?.globalName ?? authorUser?.username ?? 'Unknown'} | ID: ${authorUser?.id ?? 'Unknown'}` });

	try {
		await logsChannelOBJ.send({ embeds: [log] });
		logInfo('messageUpdate: sent edit log', { guild: guild.id, channel: channel?.id, author: authorUser?.id });
	} catch (error) {
		logError('messageUpdate: failed to send embed', { error: (error as Error)?.message ?? error });
	}
});