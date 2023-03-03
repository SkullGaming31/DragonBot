import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, Client } from 'discord.js';
import ms from 'ms';
import { Event } from '../../Structures/Event';

export default new Event('messageCreate', async (message: Message) => {
    const { author, guild, content } = message;
    const bot = guild?.members.cache.get('1024600217653354526');

		if (!guild || author.bot) return;
		if (content.includes('@here') || content.includes('@everyone')) return;
		if (!content.includes(`${bot?.id}`)) return;

		const embed = new EmbedBuilder()
			.setColor('Green')
			.setDescription(`Hi ${author.username}, how can i help you out today? leave a breif description of what your issue is and someone will get to you as soon as they are free, \n\nthis message will self destruct in 1 minute.`)
			.setThumbnail(`${author.displayAvatarURL({ size: 512 })}`)
            .setFooter({ text: guild.name });

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setURL('https://github.com/SkullGaming31/skullgaming31')
				.setLabel('SkullGaming31s Github'),
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setURL('https://twitch.tv/canadiendragon')
				.setLabel('SkullGaming31s Twitch'),
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setURL('https://discord.com/api/oauth2/authorize?client_id=1024600217653354526&permissions=3704342965494&redirect_uri=https%3A%2F%2Fdiscord.events.stdlib.com%2Fdiscord%2Fauth%2F&response_type=code&scope=identify%20guilds%20guilds.join%20applications.commands%20bot')
				.setLabel('Invite Me')
		);

		return message.reply({ embeds: [embed], components: [row] }).then(msg =>
			setInterval(() => {
				msg.delete().catch(err => { if (err.code !== 10008) return console.error(err); });
			}, ms('1m')));
})