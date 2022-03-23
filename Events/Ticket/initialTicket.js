const { ButtonInteraction, MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const db = require('../../Structures/Schemas/Ticket');
const config = require('../../Structures/config');

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

		const everyoneRole = interaction.guild.roles.cache.get(interaction.guild.id);
		try {
			if (guild.available)
				await guild.channels.create(`${customId + '-' + ID}`, {
					type: 'GUILD_TEXT',
					parent: config.DISCORD_TICKET_SYSTEM_ID,
					permissionOverwrites: [
						{
							id: member.id,
							allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
						},
						{
							id: everyoneRole,
							deny: ['VIEW_CHANNEL']
						},
						{
							id: config.DISCORD_BOT_ROLE_ID,
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
						.setAuthor({ name: `${guild.name} | Ticket: ${ID}` })
						.setDescription('Please wait patiently for a response from the staff team, in the mean time, please Describe your issue in as much detail as possible')
						.setColor('BLUE')
						.setFooter({ text: 'the buttons below are staff only buttons' });
	
					const Buttons = new MessageActionRow();
					Buttons.addComponents(
						new MessageButton().setCustomId('close').setLabel('Save And Close Ticket').setStyle('PRIMARY').setEmoji('💾'),
						new MessageButton().setCustomId('lock').setLabel('Lock').setStyle('SECONDARY').setEmoji('🔒'),
						new MessageButton().setCustomId('unlock').setLabel('Unlock').setStyle('SUCCESS').setEmoji('🔓'),
						new MessageButton().setCustomId('claim').setLabel('Claim').setStyle('PRIMARY').setEmoji('🛄')
					);
					await channel.send({ embeds: [embed], components: [Buttons] });
					await channel.send({ content: `${member} here is your ticket` }).then((m) => {
						setTimeout(() => {
							m.delete().catch((err) => { console.error(err); });
						}, 1 * 5000);
					});
					interaction.reply({ content: `${member} your ticket has been created: ${channel}`, ephemeral: true });
				});	
		} catch (error) {
			console.error(error);
		}
	}
};