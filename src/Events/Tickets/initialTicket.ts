import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, MessageFlags } from 'discord.js';
import DB from '../../Database/Schemas/ticketDB';
import TicketSetup from '../../Database/Schemas/ticketSetupDB';
import { Event } from '../../Structures/Event';

export default new Event('interactionCreate', async (interaction) => {
	if (!interaction.isButton() || !interaction.inCachedGuild()) return;
	const { guild, member, customId } = interaction;

	const Data = await TicketSetup.findOne({ GuildID: guild?.id });
	if (!Data) return;

	if (!Data.Buttons.includes(customId)) return;

	const ID = Math.floor(Math.random() * 90000) + 10000;

	try {
		await guild?.channels
			.create({
				name: `${customId + '-' + ID}`,
				type: ChannelType.GuildText,
				parent: Data.Category,
				permissionOverwrites: [
					{
						id: member?.id,
						allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory', 'AttachFiles', 'EmbedLinks'],
					},
					{
						id: Data.Everyone,
						deny: ['ViewChannel'],
					},
					{
						id: Data.BotRole,
						allow: ['ViewChannel', 'SendMessages']
					},
				]
			})
			.then(async (channel) => {
				await DB.create({
					GuildID: guild.id,
					MembersID: member?.id,
					TicketID: ID,
					ChannelID: channel.id,
					Closed: false,
					Locked: false,
					Type: customId,
					Claimed: false,
				});
				const embed = new EmbedBuilder()
					.setAuthor({ name: `${guild.name} | Ticket: ${ID}` })
					.setDescription('Please wait patiently for a response from the staff team, in the mean time, please Describe your issue in as much detail as possible')
					.setColor('Blue')
					.setFooter({ text: 'the buttons below are staff only buttons' });

				const Buttons = new ActionRowBuilder<ButtonBuilder>();
				Buttons.addComponents(
					new ButtonBuilder()
						.setCustomId('close')
						.setLabel('Save And Close Ticket')
						.setStyle(ButtonStyle.Primary)
						.setEmoji('💾'),
					new ButtonBuilder()
						.setCustomId('lock')
						.setLabel('Lock')
						.setStyle(ButtonStyle.Danger)
						.setEmoji('🔒'),
					new ButtonBuilder()
						.setCustomId('unlock')
						.setLabel('Unlock')
						.setStyle(ButtonStyle.Success)
						.setEmoji('🔓'),
					new ButtonBuilder()
						.setCustomId('claim')
						.setLabel('Claim')
						.setStyle(ButtonStyle.Secondary)
						.setEmoji('🛄')
				);
				await channel.send({ embeds: [embed], components: [Buttons], });
				await channel.send({ content: `${member} here is your ticket` }).then((m) => {
					setTimeout(() => {
						m.delete().catch((err: Error) => { console.error(err); });
					}, 5000); // 1000ms = 1 second
				}).catch((err: Error) => { console.error(err); });
				await interaction.reply({ content: `${member} your ticket has been created: ${channel}`, flags: MessageFlags.Ephemeral, });
			});
	} catch (error) {
		console.error(error);
		return;
	}
});