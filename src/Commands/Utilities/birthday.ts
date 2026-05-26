import { ApplicationCommandOptionType, ApplicationCommandType, channelMention, ChannelType } from 'discord.js';
import { Command } from '../../Structures/Command';
import BirthdayModel from '../../Database/Schemas/birthdayDB';
import BirthdaySettingsModel from '../../Database/Schemas/birthdaySettingsDB';
import { safeInteractionReply } from '../../Utilities/functions';

function parseDate(input: string) {
	// Accept YYYY-MM-DD or MM-DD
	const iso = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
	const md = /^([0-9]{2})-([0-9]{2})$/;
	let year: number | null = null;
	let month: number;
	let day: number;
	let m;
	if ((m = iso.exec(input))) {
		year = Number(m[1]);
		month = Number(m[2]);
		day = Number(m[3]);
	} else if ((m = md.exec(input))) {
		month = Number(m[1]);
		day = Number(m[2]);
	} else {
		return null;
	}
	if (month < 1 || month > 12) return null;
	if (day < 1 || day > 31) return null;
	return { year, month, day };
}

export default new Command({
	name: 'birthday',
	description: 'Manage your birthday and birthday channel',
	type: ApplicationCommandType.ChatInput,
	Category: 'Utilities',
	options: [
		{
			name: 'set',
			description: 'Set your birthday (YYYY-MM-DD or MM-DD)',
			type: ApplicationCommandOptionType.Subcommand,
			options: [{ name: 'date', type: ApplicationCommandOptionType.String, description: 'Date in YYYY-MM-DD or MM-DD', required: true }]
		},
		{
			name: 'remove',
			description: 'Remove your birthday',
			type: ApplicationCommandOptionType.Subcommand
		},
		{
			name: 'channel',
			description: 'Set the channel for birthday messages (admin only)',
			type: ApplicationCommandOptionType.Subcommand,
			options: [{ name: 'channel', type: ApplicationCommandOptionType.Channel, description: 'Channel to post birthdays to', required: true }]
		},
		{
			name: 'info',
			description: 'Show your saved birthday (optionally mention a user)',
			type: ApplicationCommandOptionType.Subcommand,
			options: [{ name: 'user', type: ApplicationCommandOptionType.User, description: 'User to view', required: false }]
		}
		,
		{
			name: 'test',
			description: 'Trigger a birthday message for testing (you or specified user)',
			type: ApplicationCommandOptionType.Subcommand,
			options: [{ name: 'user', type: ApplicationCommandOptionType.User, description: 'User to test (admin only)', required: false }]
		}
	],
	defaultMemberPermissions: ['SendMessages'],

	run: async ({ interaction }) => {
		const sub = interaction.options.getSubcommand(true);
		const guildId = interaction.guildId;
		const userId = interaction.user.id;
		if (!guildId) return safeInteractionReply(interaction, { content: 'This command must be used in a guild.' });

		if (sub === 'test') {
			const target = interaction.options.getUser('user')?.id || userId;
			// only allow testing others if user has ManageGuild
			if (target !== userId && !interaction.memberPermissions?.has('ManageGuild')) return safeInteractionReply(interaction, { content: 'You need Manage Guild to test other users.', ephemeral: true });
			const rec = await BirthdayModel.findOne({ guildID: guildId, userID: target }).lean();
			if (!rec) return safeInteractionReply(interaction, { content: 'No birthday set for that user.', ephemeral: true });
			const settings = await BirthdaySettingsModel.findOne({ GuildID: guildId }).lean();
			const channelId = settings?.ChannelID ?? undefined;
			// trigger greeting
			try {
				await (require('../../Utilities/birthdayScheduler')).sendBirthdayGreeting(interaction.client, guildId, target, channelId, rec.year ?? null);
				return safeInteractionReply(interaction, { content: 'Birthday test message triggered.', ephemeral: true });
			} catch (err) {
				const msg = (err as unknown as Error)?.message ?? String(err);
				return safeInteractionReply(interaction, { content: `Failed to send test message: ${msg}`, ephemeral: true });
			}
		}

		if (sub === 'set') {
			const dateStr = interaction.options.getString('date', true);
			const parsed = parseDate(dateStr.trim());
			if (!parsed) return safeInteractionReply(interaction, { content: 'Invalid date format. Use YYYY-MM-DD or MM-DD', ephemeral: true });
			await BirthdayModel.findOneAndUpdate({ guildID: guildId, userID: userId }, { guildID: guildId, userID: userId, month: parsed.month, day: parsed.day, year: parsed.year ?? null }, { upsert: true });
			return safeInteractionReply(interaction, { content: `Saved your birthday as ${parsed.month}-${parsed.day}${parsed.year ? `-${parsed.year}` : ''}`, ephemeral: true });
		}

		if (sub === 'remove') {
			await BirthdayModel.deleteOne({ guildID: guildId, userID: userId }).catch(() => null);
			return safeInteractionReply(interaction, { content: 'Removed your birthday.', ephemeral: true });
		}

		if (sub === 'channel') {
			if (!interaction.memberPermissions?.has('ManageGuild')) return safeInteractionReply(interaction, { content: 'You need Manage Guild permission to set the channel.', ephemeral: true });
			const ch = interaction.options.getChannel('channel', true);
			if (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.GuildPublicThread) return safeInteractionReply(interaction, { content: 'Please choose a text channel.', ephemeral: true });
			await BirthdaySettingsModel.findOneAndUpdate({ GuildID: guildId }, { GuildID: guildId, ChannelID: ch.id }, { upsert: true });
			return safeInteractionReply(interaction, { content: `Birthday messages will be posted in ${channelMention(ch.id)}`, ephemeral: false });
		}

		if (sub === 'info') {
			const target = interaction.options.getUser('user')?.id || userId;
			const rec = await BirthdayModel.findOne({ guildID: guildId, userID: target }).lean();
			if (!rec) return safeInteractionReply(interaction, { content: `${target === userId ? 'You have' : 'That user has'} not set a birthday.`, ephemeral: true });
			let resp = `${target === userId ? 'Your' : `<@${target}>'s`} birthday: ${rec.month}-${rec.day}${rec.year ? `-${rec.year}` : ''}`;
			if (rec.year) {
				const now = new Date();
				let age = now.getUTCFullYear() - (rec.year as number);
				// If birthday hasn't occurred yet this year, subtract 1
				const monthToday = now.getUTCMonth() + 1;
				const dayToday = now.getUTCDate();
				if (monthToday < rec.month || (monthToday === rec.month && dayToday < rec.day)) age -= 1;
				if (age >= 0) resp += ` (age: ${age})`;
			}
			return safeInteractionReply(interaction, { content: resp, ephemeral: true });
		}

		return safeInteractionReply(interaction, { content: 'Unknown subcommand', ephemeral: true });
	}
});
