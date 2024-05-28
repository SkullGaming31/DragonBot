import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, userMention } from 'discord.js';
import { Event } from '../../Structures/Event';

function createHelpEmbed(author: Message['author'], guildName?: string | undefined) {
	return new EmbedBuilder()
		.setColor('Green')
		.setDescription(`Hi ${author.globalName}, how can I help you out today? Leave a brief description of what your issue is, and someone will get to you as soon as they are free.`)
		.setThumbnail(`${author.displayAvatarURL({ size: 512 })}`)
		.setFooter({ text: guildName !== undefined ? guildName : '' });
}

function createButtonRow() {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://github.com/SkullGaming31/skullgaming31')
			.setLabel('SkullGaming31\'s Github'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://discord.com/oauth2/authorize?client_id=930882181595807774')
			.setLabel('Add Me to your Discord Server'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://twitch.tv/canadiendragon')
			.setLabel('SkullGaming31\'s Twitch')
	);
}

async function handleHelpMessage(message: Message) {
	const { author, guild, content } = message;
	const bot = guild?.members.cache.get('1147628312110305340');

	if (!guild || author.bot) return;

	if (content.includes('@here') || content.includes('@everyone')) return;

	if (!content.includes(`${bot?.id}`)) return;

	const embed = createHelpEmbed(author, guild?.name);
	const row = createButtonRow();

	const msg = await message.reply({ content: `${userMention(author.id)}, this message will delete in 5 minutes`, embeds: [embed], components: [row] });

	if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
		setTimeout(() => {
			if (msg.thread?.isThread()) {
				msg.thread.delete('time elapsed').catch((err) => { console.error('Couldn\t delete the thread', err); });
			}
			msg.delete().catch((err) => { console.error('Error deleting message: ', err); });
		}, 30000);
	} else {
		setTimeout(() => {
			if (msg.thread?.isThread()) {
				msg.thread.delete('time elapsed').catch((err) => { console.error('Couldn\t delete the thread', err); });
			}
			msg.delete().catch((err) => { console.error('Error deleting message: ', err); });
		}, 300000);
	}
	// commented code below this is just thread testing code/ safe to delete
	// const tbd = await msg.startThread({ name: `${author.globalName} Support`, reason: 'support' });
	// const tt = guild.roles.cache.find((r) => r.name === 'Admin');
	// console.log(guild.roles.cache);
	// if (!tt) return message.reply({ content: 'Role was not found or doesnt exist' });
	// if (tbd.isThread()) {
	// 	await tbd.sendTyping();
	// 	await tbd.send({ content: `${roleMention(tt?.id)} someone is requesting support` });
	// }
}

export default new Event<'messageCreate'>('messageCreate', handleHelpMessage);