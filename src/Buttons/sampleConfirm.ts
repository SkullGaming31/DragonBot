import { ButtonType } from '../Typings/Button';
import { ButtonStyle } from 'discord.js';

const button: ButtonType = {
	customId: 'confirm_purge',
	defaultLabel: 'Confirm',
	defaultStyle: ButtonStyle.Danger,
	run: async ({ interaction }) => {
		await interaction.deferUpdate();
		// This mirrors the existing purge flow; the actual DB update is left to the command
		await interaction.editReply({ content: 'Purge confirmed (handler).', components: [] });
	}
};

export default button;
