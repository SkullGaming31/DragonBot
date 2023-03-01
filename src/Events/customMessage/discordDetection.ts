import { ChannelType, Colors, EmbedBuilder, Message } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import { ExtendedClient } from '../../Structures/Client';

export default new Event('messageCreate', async (message: Message) => {
	const { guild, channel, author } = message;
	if (author.bot) return;

	let sentInText: Boolean = false;
	let warning = 0;

	/*
	ISSUE: Warnings are not increasing.
	*/

	const discordInviteList = [
		'discord.com/', 'discord.gg/',
		'https://discord.com/', 'https://discord.gg/',
		'.gift'
	];

	try {
		for (const dInvite in discordInviteList) {// discord link detection
			if (message.content.toLowerCase().includes(discordInviteList[dInvite].toLowerCase())) { sentInText = true; warning+= 1; }
			if (sentInText) {
				const discordLinkDetection = new EmbedBuilder()// sends to the channel the link was posted too.
					.setTitle('Discord Link Detected')
					.setDescription(`:x: ${author} **Do not post discord links in this server.**`)
					.setColor(Colors.Red)
					.setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() })
					.setThumbnail(author.displayAvatarURL())
					.setFooter({ text: `UserID: ${author.id}`, iconURL: author.displayAvatarURL()} )
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


				// if (guild?.ownerId === author.id || author.id === '353674019943219204' || author.id === '557517338438664223') return;
				// if (admin || mod) return;
				if (channel.id === '713791344803577868' || channel.id === '959693430647308292') {// channel(s) you dont want the bot to delete discord links from
					return;
				} else {
					await message.reply({ content: `${author}`, embeds: [discordLinkDetection] }); // send this warning embed to the channel the link was detected in
					await message.delete().catch((error) => { console.error(error); return; });
					sentInText = false;
				}
				console.log('Warning: ' + warning);
			}
		}
	} catch (error) {
		console.error(error);
		return;
	}
});