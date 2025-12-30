import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';
import AutoModModel from '../../Database/Schemas/autoMod';

export default new Command({
	name: 'automod',
	description: 'Configure Auto-moderation for this guild',
	type: ApplicationCommandType.ChatInput,
	Category: 'Moderator',
	defaultMemberPermissions: ['ManageGuild'],
	options: [
		{ name: 'status', description: 'Show current automod config', type: ApplicationCommandOptionType.Subcommand },
		{ name: 'toggle', description: 'Enable or disable automod', type: ApplicationCommandOptionType.Subcommand, options: [{ name: 'enabled', description: 'true/false', type: ApplicationCommandOptionType.String, required: true }] },
		{ name: 'set-spam-threshold', description: 'Set messages-per-window threshold', type: ApplicationCommandOptionType.Subcommand, options: [{ name: 'count', description: 'Number of messages', type: ApplicationCommandOptionType.Integer, required: true }] },
	],
	run: async ({ interaction }) => {
		const sub = interaction.options.getSubcommand(true);
		const guildId = interaction.guildId;
		if (!guildId) return interaction.reply({ content: 'This command must be used in a guild.', ephemeral: true });

		let config = await AutoModModel.findOne({ guildId }).exec();
		if (!config) {
			config = new AutoModModel({ guildId });
		}

		if (sub === 'status') {
			const embed = new EmbedBuilder().setTitle('AutoMod Status')
				.addFields([
					{ name: 'Enabled', value: String(config.enabled ?? true), inline: true },
					{ name: 'Invite Links', value: String(config.rules?.inviteLinks?.enabled ?? true), inline: true },
					{ name: 'Caps', value: String(config.rules?.caps?.enabled ?? true), inline: true },
					{ name: 'Spam', value: String(config.rules?.spam?.enabled ?? true), inline: true },
					{ name: 'Spam threshold', value: String(config.rules?.spam?.threshold ?? 5), inline: true },
				]);
			return interaction.reply({ embeds: [embed], ephemeral: true });
		}

		if (sub === 'toggle') {
			const enabledStr = interaction.options.getString('enabled', true).toLowerCase();
			const enabled = enabledStr === 'true' || enabledStr === '1' || enabledStr === 'on';
			config.enabled = enabled;
			await config.save();
			return interaction.reply({ content: `AutoMod is now ${enabled ? 'enabled' : 'disabled'}.`, ephemeral: true });
		}

		if (sub === 'set-spam-threshold') {
			const count = interaction.options.getInteger('count', true);
			config.rules = config.rules ?? { inviteLinks: { enabled: true }, caps: { enabled: true, threshold: 70 }, spam: { enabled: true, threshold: 5 } };
			config.rules.spam.threshold = Math.max(1, count);
			await config.save();
			return interaction.reply({ content: `Spam threshold set to ${config.rules.spam.threshold}.`, ephemeral: true });
		}

		return interaction.reply({ content: 'Unknown subcommand', ephemeral: true });
	},
});
