const { ButtonInteraction, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const db = require('../../Structures/Schemas/Ticket');
const { DISCORD_TICKET_SYSTEM_ID, DISCORD_EVERYONE_ROLE_ID, DISCORD_BOT_ROLE_ID } = require('../../Structures/config');

// module.exports = {
// 	name: 'interactionCreate',

// 	/**
//    * @param {ButtonInteraction} interaction 
//    */

// 	async execute(interaction) {
// 		if (!interaction.isButton) return;
// 		const {  guild, member, customId } = interaction;
// 		if (!['player','bug','support'].includes(customId)) return;

// 		const ID = Math.floor(Math.random() * 90000) + 10000;

// 		await guild.channels.create(`${customId + '-' + ID}`, {
// 			type: 'GUILD_TEXT',
// 			parent: DISCORD_TICKET_SYSTEM_ID,
// 			permissionOverwrites: [
// 				{
// 					id: member.id,
// 					allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
// 				},
// 				{
// 					id: DISCORD_EVERYONE_ROLE_ID,
// 					deny: ['VIEW_CHANNEL']
// 				},
// 				{
// 					id: DISCORD_BOT_ROLE_ID,
// 					allow: ['SEND_MESSAGES', 'EMBED_LINKS', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
// 				}
// 			]
// 		}).then(async(channel) => {
// 			await db.create({
// 				GuildID: guild.id,
// 				MembersID: member.id,
// 				TicketID: ID,
// 				ChannelID: channel.id,
// 				Closed: false,
// 				Locked: false,
// 				Type: customId
// 			});
// 			const embed = new MessageEmbed()
// 				.setAuthor({ name: `${guild.name} | Ticket: ${ID}`, iconURL: `${guild.iconURL({ dynamic: true })}`})
// 				.setDescription('Please wait patiently for a response from the staff team, in the mean time, please Describe your issue in as much detail as possible')
// 				.setFooter({ text: 'the buttons below are staff only buttons', iconURL: `${guild.iconURL({ dynamic: true })}` });

// 			const Buttons = new MessageActionRow();
// 			Buttons.addComponents(
// 				new MessageButton().setCustomId('close').setLabel('Save And Close Ticket').setStyle('PRIMARY').setEmoji('💾'),
// 				new MessageButton().setCustomId('lock').setLabel('Lock').setStyle('DANGER').setEmoji('🔒'),
// 				new MessageButton().setCustomId('unlock').setLabel('Unlock').setStyle('SUCCESS').setEmoji('🔓'),
// 				new MessageButton().setCustomId('claim').setLabel('Claim').setStyle('PRIMARY').setEmoji('🛄')
// 			);
// 			channel.send({ embeds: [embed], components: [Buttons] });
// 			console.log(`${member} has created a ticket`);
// 			await channel.send({ content: `${member} here is your ticket` }).then((m) => {
// 				setTimeout(() => {
// 					m.delete().catch(() => {});
// 				}, 1 * 5000);
// 			});
// 			interaction.reply({ content: `${member} your ticket has been created: ${channel}`, ephemeral: true });
// 		});
// 	}
// };

module.exports = {
	name: 'interactionCreate',

	/**
   * @param {ButtonInteraction} interaction 
   */

	async execute(interaction) {
		if (!interaction.isButton) return;
		const {  guild, member, customId } = interaction;
		if (!['player','bug','support'].includes(customId)) return;

		const ID = Math.floor(Math.random() * 90000) + 10000;

		await guild.channels.create(`${customId + '-' + ID}`, {
			type: 'GUILD_TEXT',
			parent: DISCORD_TICKET_SYSTEM_ID,
			permissionOverwrites: [
				{
					id: member.id,
					allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
				},
				{
					id: DISCORD_EVERYONE_ROLE_ID,
					deny: ['VIEW_CHANNEL']
				},
				{
					id: DISCORD_BOT_ROLE_ID,
					allow: ['SEND_MESSAGES', 'EMBED_LINKS', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
				}
			]
		}).then(async(channel) => {
			await db.create({
				GuildID: guild.id,
				MembersID: member.id,
				TicketID: ID,
				ChannelID: channel.id,
				Closed: false,
				Locked: false,
				Type: customId
			});
			const embed = new MessageEmbed()
				.setAuthor({ name: `${guild.name} | Ticket: ${ID}`, iconURL: `${guild.iconURL({ dynamic: true })}`})
				.setDescription('Please wait patiently for a response from the staff team, in the mean time, please Describe your issue in as much detail as possible')
				.setFooter({ text: 'the buttons below are staff only buttons', iconURL: `${guild.iconURL({ dynamic: true })}` });

			const Buttons = new MessageActionRow();
			Buttons.addComponents(
				new MessageButton().setCustomId('close').setLabel('Save And Close Ticket').setStyle('PRIMARY').setEmoji('💾'),
				new MessageButton().setCustomId('lock').setLabel('Lock').setStyle('SECONDARY').setEmoji('🔒'),
				new MessageButton().setCustomId('unlock').setLabel('Unlock').setStyle('SUCCESS').setEmoji('🔓'),
				new MessageButton().setCustomId('claim').setLabel('Claim').setStyle('PRIMARY').setEmoji('🛄')
			);
			channel.send({ embeds: [embed], components: [Buttons] });
			console.log(`${member} has created a ticket`);
			await channel.send({ content: `${member} here is your ticket` }).then((m) => {
				setTimeout(() => {
					m.delete().catch(() => {});
				}, 1 * 5000);
			});
			interaction.reply({ content: `${member} your ticket has been created: ${channel}`, ephemeral: true });
		});
	}
};