import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, MessageFlags } from 'discord.js';
import DB from '../../Database/Schemas/ticketDB';
import TicketSetup from '../../Database/Schemas/ticketSetupDB';
import TemplateModel from '../../Database/Schemas/ticketTemplateDB';
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
				// Try to apply a template: prefer a template matching the button type, otherwise use guild default
				const template = (await TemplateModel.findOne({ GuildID: guild.id, Type: customId }).exec())
					|| (await TemplateModel.findOne({ GuildID: guild.id, IsDefault: true }).exec());

				const embed = new EmbedBuilder().setAuthor({ name: `${guild.name} | Ticket: ${ID}` }).setColor('Blue').setFooter({ text: 'the buttons below are staff only buttons' });
				if (template?.Title) embed.setTitle(template.Title);
				if (template?.Description) embed.setDescription(template.Description);

				// Staff-only buttons (always present)
				const staffButtons = new ActionRowBuilder<ButtonBuilder>();
				staffButtons.addComponents(
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

				// Template buttons (optional) - attempt to parse stored button definitions
				let templateRow: ActionRowBuilder<ButtonBuilder> | null = null;
				if (template?.Buttons && template.Buttons.length) {
					templateRow = new ActionRowBuilder<ButtonBuilder>();
					const defs = template.Buttons;
					// Support two storage formats: alternating [label, emoji, label, emoji] or single 'label|emoji' entries
					if (defs.length % 2 === 0 && defs.every(d => typeof d === 'string')) {
						// treat as alternating label/emoji pairs
						for (let i = 0; i < defs.length; i += 2) {
							const label = defs[i];
							const emoji = defs[i + 1];
							if (!label) continue;
							templateRow.addComponents(
								new ButtonBuilder()
									.setCustomId(`tpl_${label.replace(/\s+/g, '_').toLowerCase()}`)
									.setLabel(label)
									.setStyle(ButtonStyle.Primary)
							);
						}
					} else {
						for (const entry of defs) {
							let label = entry as string;
							let emoji: string | undefined;
							if (entry.includes('|')) {
								[label, emoji] = entry.split('|').map(s => s.trim());
							} else if (entry.includes(',')) {
								[label, emoji] = entry.split(',').map(s => s.trim());
							}
							if (!label) continue;
							templateRow.addComponents(
								new ButtonBuilder()
									.setCustomId(`tpl_${label.replace(/\s+/g, '_').toLowerCase()}`)
									.setLabel(label)
									.setStyle(ButtonStyle.Primary)
							);
						}
					}
				}

				const components = templateRow ? [templateRow, staffButtons] : [staffButtons];
				await channel.send({ embeds: [embed], components }).catch(() => null);
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