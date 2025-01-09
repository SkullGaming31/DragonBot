import { BaseInteraction, ChannelType, Colors, EmbedBuilder, GuildMember, MessageFlags } from 'discord.js';
import { Event } from '../../Structures/Event';
// import settings from '../../Structures/Schemas/settingsDB';
import DB, { Ticket } from '../../Database/Schemas/ticketDB';
import ticket from '../../Database/Schemas/ticketSetupDB';

export default new Event('interactionCreate', async (interaction: BaseInteraction) => {
	if (!interaction.isButton() || !interaction.inCachedGuild()) return;

	const { guild, customId, channel, member } = interaction;
	if (!['close', 'lock', 'unlock', 'claim'].includes(customId)) return;

	const TicketSetup = await ticket.findOne({ GuildID: guild.id });
	if (!TicketSetup) return interaction.reply({ content: 'the data for this system is outdated' });

	// TODO: grab Admin/mod RoleID from database
	// const settingsData = await settings.findOne({ Guild: guild.id });
	// if (!settingsData) return;

	// const adminRoleId = settingsData.AdministratorRole as string;
	// const moderatorRoleId = settingsData.ModeratorRole as string;

	const adminRoleId = '959693430244642816';// test server
	const moderatorRoleId = '959693430227894300';// test server
	// const adminRoleId = '186117711611428866';// mainServer
	// const moderatorRoleId = '708768425388015728';// mainServer

	const isAdminOrModerator = member.permissions.has(adminRoleId) || member.permissions.has(moderatorRoleId);
	if (!isAdminOrModerator) { return interaction.reply({ content: `you must have the <@&${adminRoleId}> or <@&${moderatorRoleId}> role to interact with these buttons`, flags: MessageFlags.Ephemeral }); }

	const embed = new EmbedBuilder().setColor(Colors.Blue);

	DB.findOne({ ChannelID: channel?.id }, async (err: Error, docs: any) => {
		if (err) throw err;
		if (!docs) return interaction.reply({ content: 'no data was found related to this ticket, please delete it manually', flags: MessageFlags.Ephemeral });

		switch (customId) {
			case 'lock':
				if (docs.Locked == true)
					return interaction.reply({ content: 'this ticket is already Locked', flags: MessageFlags.Ephemeral });
				await DB.updateOne({ ChannelID: channel?.id }, { Locked: true });
				embed.setDescription('🔒 | this channel is now locked Pending Review');

				if (channel?.type === ChannelType.GuildText)
					docs.MembersID?.forEach((m: GuildMember) => {
						channel?.permissionOverwrites.edit(m, {
							SendMessages: false,
							EmbedLinks: false,
							AttachFiles: false,
						});
					});
				await interaction.reply({ embeds: [embed] });
				break;
			case 'unlock':
				if (docs.Locked == false)
					return interaction.reply({ content: 'this ticket is already unlocked', flags: MessageFlags.Ephemeral });
				await DB.updateOne({ ChannelID: channel?.id }, { Locked: false });
				embed.setDescription('🔓 | this channel has been unlocked');
				if (channel?.type === ChannelType.GuildText)
					docs.MembersID.forEach((m: GuildMember) => {
						channel?.permissionOverwrites.edit(m, {
							SendMessages: true,
							EmbedLinks: true,
							AttachFiles: true,
						});
					});
				interaction.reply({ embeds: [embed] });
				break;
			case 'close':
				if (docs.Closed)
					return interaction.reply({ content: 'Ticket is already closed, please wait for it to be automatically deleted', flags: MessageFlags.Ephemeral });
				await DB.updateOne({ ChannelID: channel?.id }, { Closed: true });
				// const Message = await guild.channels.cache.get(TicketSetup.Transcripts).send({ embeds: [embed.setTitle(`Transcript Type: ${docs.Type}\nID: ${docs.TicketID}`)], files: [attachments] });
				await interaction.reply({ content: 'The channel will deleted in 10 seconds.', /* embeds: [embed.setDescription(`the transcript is now saved [TRANSCRIPT](${Message.url})`),], */ });
				setTimeout(async () => {
					await channel?.delete().catch((err: Error) => { console.error(err); });
				}, 10 * 1000);

				await DB.deleteOne({ ChannelID: channel?.id });
				break;
			case 'claim':
				if (docs.Claimed == true) return interaction.reply({ content: `this ticket has already been claimed by <@${docs.ClaimedBy}>`, flags: MessageFlags.Ephemeral });
				await DB.updateOne({ ChannelID: channel?.id }, { Claimed: true, ClaimedBy: member.id });

				embed.setDescription(`🛄 | this ticket is now claimed by ${member}`);
				await interaction.reply({ embeds: [embed] });
				break;
		}
	});
});