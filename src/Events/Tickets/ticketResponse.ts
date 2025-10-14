 
import { BaseInteraction, ChannelType, Colors, EmbedBuilder, Collection, Message } from 'discord.js';
import { Event } from '../../Structures/Event';
// import settings from '../../Structures/Schemas/settingsDB';
import DB from '../../Database/Schemas/ticketDB';
import ticket from '../../Database/Schemas/ticketSetupDB';
import { safeInteractionReply } from '../../Utilities/functions';

export default new Event('interactionCreate', async (interaction: BaseInteraction) => {
	if (!interaction.isButton() || !interaction.inCachedGuild()) return;

	const { guild, customId, channel, member } = interaction;
	if (!['close', 'lock', 'unlock', 'claim'].includes(customId)) return;

	const TicketSetup = await ticket.findOne({ GuildID: guild.id });
	if (!TicketSetup) return safeInteractionReply(interaction, { content: 'the data for this system is outdated', ephemeral: true });

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
	if (!isAdminOrModerator) { return safeInteractionReply(interaction, { content: `you must have the <@&${adminRoleId}> or <@&${moderatorRoleId}> role to interact with these buttons`, ephemeral: true }); }

	const embed = new EmbedBuilder().setColor(Colors.Blue);

	try {
		// Use async/await with .exec() to avoid deprecated callback usage
		const docs = await DB.findOne({ ChannelID: channel?.id }).exec();
		if (!docs) return safeInteractionReply(interaction, { content: 'no data was found related to this ticket, please delete it manually', ephemeral: true });

		switch (customId) {
			case 'lock':
				if (docs.Locked == true)
					return safeInteractionReply(interaction, { content: 'this ticket is already Locked' });
				await DB.updateOne({ ChannelID: channel?.id }, { Locked: true });
				embed.setDescription('🔒 | this channel is now locked Pending Review');

				if (channel?.type === ChannelType.GuildText)
					docs.MembersID?.forEach((m: string) => {
						channel?.permissionOverwrites.edit(m, {
							SendMessages: false,
							EmbedLinks: false,
							AttachFiles: false,
						});
					});
				await safeInteractionReply(interaction, { embeds: [embed] });
				break;
			case 'unlock':
				if (docs.Locked == false)
					return safeInteractionReply(interaction, { content: 'this ticket is already unlocked', ephemeral: true });
				await DB.updateOne({ ChannelID: channel?.id }, { Locked: false });
				embed.setDescription('🔓 | this channel has been unlocked');
				if (channel?.type === ChannelType.GuildText)
					docs.MembersID?.forEach((m: string) => {
						channel?.permissionOverwrites.edit(m, {
							SendMessages: true,
							EmbedLinks: true,
							AttachFiles: true,
						});
					});
				await safeInteractionReply(interaction, { embeds: [embed] });
				break;
			case 'close':
				if (docs.Closed)
					return safeInteractionReply(interaction, { content: 'Ticket is already closed, please wait for it to be automatically deleted', ephemeral: true });
				await DB.updateOne({ ChannelID: channel?.id }, { Closed: true });
				await safeInteractionReply(interaction, { content: 'The channel will deleted in 10 seconds.' });

				// Save transcript as HTML if configured
				try {
					const setup = await ticket.findOne({ GuildID: guild.id }).exec();
					const transcriptChannelId = setup?.Transcripts;
					if (transcriptChannelId && channel?.isTextBased()) {
						// Paginate messages (Discord API max 100 per request). We'll gather up to a sensible cap to avoid memory/size issues.
						const allMessages: Message[] = [];
						let lastId: string | undefined = undefined;
						const CAP = 5000; // hard limit of messages to fetch
						while (allMessages.length < CAP) {
							const fetchOptions: { limit: number; before?: string } = { limit: 100 };
							if (lastId) fetchOptions.before = lastId;
							const batch = (await channel.messages.fetch(fetchOptions)) as unknown as Collection<string, Message>;
							if (!batch.size) break;
							allMessages.push(...Array.from(batch.values()));
							lastId = batch.first()?.id;
							if (batch.size < 100) break; // no more
						}

						// Messages are fetched newest-first; reverse for chronological order
						const ordered = allMessages.reverse();

						// Build a minimal HTML transcript
						const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
						const rows = ordered.map(m => {
							const time = new Date(m.createdTimestamp).toLocaleString();
							const authorRaw = m.author as unknown as { globalName?: string; username?: string; tag: string; id: string; bot?: boolean };
							const authorNameCandidate = authorRaw.globalName ?? (authorRaw.username ?? authorRaw.tag);
							const authorName = authorRaw.bot ? authorRaw.tag : authorNameCandidate;
							const author = escapeHtml(`${authorName} (${authorRaw.id})`);
							const content = escapeHtml(m.content ?? '');
							const attachments = m.attachments.map(a => `<a href="${a.url}">${escapeHtml(a.name || a.url)}</a>`).join(' ');
							return `<div class="msg"><div class="meta"><span class="time">${time}</span> <span class="author">${author}</span></div><div class="content">${content}</div>${attachments ? `<div class="attachments">${attachments}</div>` : ''}</div>`;
						});

						const html = `<!doctype html><html><head><meta charset="utf-8"><title>Transcript ${docs.TicketID || channel?.id}</title><style>
						body{font-family:Arial,Helvetica,sans-serif;background:#f6f6f6;color:#111;padding:16px}
						.msg{background:#fff;border:1px solid #ddd;padding:8px;margin:8px 0;border-radius:6px}
						.meta{font-size:12px;color:#555;margin-bottom:6px}
						.content{white-space:pre-wrap}
						.attachments{margin-top:6px}
						</style></head><body><h1>Transcript - ${escapeHtml(String(docs.TicketID || channel?.id))}</h1>${rows.join('\n')}</body></html>`;

						const target = await guild.channels.fetch(transcriptChannelId).catch(() => null);
						if (target && typeof (target as unknown as { send?: unknown })['send'] === 'function') {
							const filename = `transcript-${docs.TicketID || channel?.id}.html`;
							try {

								const sendFn = (target as unknown as { send?: (..._args: unknown[]) => Promise<unknown> }).send;
								if (sendFn) await sendFn.call(target, { files: [{ attachment: Buffer.from(html, 'utf8'), name: filename }] });
							} catch (uploadErr) {
								console.error('Failed to upload transcript file:', uploadErr);
							}
						}
					}
				} catch (e) {
					console.error('Failed to save transcript:', e);
				}
				setTimeout(async () => {
					await channel?.delete().catch((err: Error) => { console.error(err); });
				}, 10 * 1000);

				await DB.deleteOne({ ChannelID: channel?.id });
				break;
			case 'claim':
				if (docs.Claimed == true) return safeInteractionReply(interaction, { content: `this ticket has already been claimed by <@${docs.ClaimedBy}>`, ephemeral: true });
				await DB.updateOne({ ChannelID: channel?.id }, { Claimed: true, ClaimedBy: member.id });

				embed.setDescription(`🛄 | this ticket is now claimed by ${member}`);
				await safeInteractionReply(interaction, { embeds: [embed] });
				break;
		}
	} catch (err) {
		console.error(err);
		return;
	}
});