import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import { Event } from '../../../src/Structures/Event';

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	if (!message.inGuild()) return;
	const { channel, author } = message;
	if (author.bot) return;

	let sentInText = false;
	let warning = 0;

	/*
	ISSUE: Warnings are not increasing.
	*/

	const discordInviteList = [
		'discord.com/', 'discord.gg/',
		'https://discord.com/', 'https://discord.gg/',
		'.gift'
	];
	if (author.id === '353674019943219204') return;

	try {
		for (const dInvite in discordInviteList) {// discord link detection
			if (message.content.toLowerCase().includes(discordInviteList[dInvite].toLowerCase())) { sentInText = true; }
			if (sentInText) {
				const discordLinkDetection = new EmbedBuilder()// sends to the channel the link was posted too.
					.setTitle('Discord Link Detected')
					.setDescription(`:x: ${author} **Do not post discord links in this server.**`)
					.setColor('Red')
					.setAuthor({ name: author.tag, iconURL: author.displayAvatarURL({ size: 512 }) })
					.setThumbnail(author.displayAvatarURL())
					.setFooter({ text: `UserID: ${author.id}`, iconURL: author.displayAvatarURL({ size: 512 })} )
					.setTimestamp();

				switch (warning) {
				case 1:// first warning
					discordLinkDetection.setDescription('This is your first warning Please do not post discord links in this server.');
					discordLinkDetection.addFields({ name: 'Warnings', value: `${warning}` });
					console.log('First Warning');
					break;
				case 2:// 2nd warning
					// message.member.timeout(ms('5m'), 'Posted Discord Link');
					discordLinkDetection.setDescription('Member has been timedout for 5 minutes for posting discord links in the server');
					discordLinkDetection.addFields({ name: 'Warnings', value: `${warning}` });
					console.log('Member has been Timed Out');
					break;
				case 3:// final warning
					// message.member.ban({ deleteMessageDays: 7, reason: 'Posted Discord Link more then 3 times' });
					discordLinkDetection.setDescription('Member has been banned for posting discord links in the server');
					discordLinkDetection.addFields({ name: 'Warnings', value: `${warning}` });
					console.log('Member has been banned for posting discord links');
					break;
				}
				if (channel.id === '959693430647308292') { return; }// Moderator Channel
				else {
					if (channel.type === ChannelType.GuildText) {
						await message.reply({ content: `${author}`, embeds: [discordLinkDetection] }); // send this warning embed to the channel the link was detected in
						await message.delete().catch((error) => { console.error(error); return; });
						warning += 1;
						sentInText = false;
					}
				}
				// console.log('Warning: ' + warning);
				// Get the channel object where the forum posts are located
				// const forumChannel = guild?.channels.cache.get('1020536302388662303') as ThreadChannel | NewsChannel;// Channel Parent ID for the forums channel

				// if (forumChannel.isThread()) {
				// 	// Fetch the messages in the channel
				// 	guild.channels.fetch();
				// 	const messages = await forumChannel.messages.fetch();

				// 	// Loop through the messages and check for Discord invite links
				// 	messages.forEach(async (message) => {
				// 		const inviteRegex = /(discord\.(gg|com|io|me|gift)\/.+|discordapp\.com\/invite\/.+)/g;
				// 		const content = message.content.toLowerCase();
				// 		if (inviteRegex.test(content)) {
				// 		// Take the appropriate action if a Discord invite link is found
				// 			console.log(`Message ${message.id} contains a Discord invite link`);
				// 			if (forumChannel.type === ChannelType.PublicThread)
				// 				await message.delete().catch((err: Error) => { console.error(err.message); });
				// 			forumChannel.setLocked(true, 'Detected Discord Link');
				// 			forumChannel.setArchived(true, 'Detected Discord Link');
				// 			forumChannel.sendTyping();
				// 			forumChannel.send({ embeds: [discordLinkDetection] });
				// 		}
				// 	});
				// }
			}
		}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error(error.message);
	}
});