// https://official-joke-api.appspot.com/random_joke
import axios from 'axios';
import { ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { IjokeAPI } from '../../Interfaces/jokesInterface';
import { Command } from '../../Structures/Command';
axios.defaults;

export default new Command({
	name: 'joke',
	description: 'a random joke',
	UserPerms: ['Administrator'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['Administrator'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		const { user } = interaction;
		await interaction.deferReply();
		const jokeURL = 'https://official-joke-api.appspot.com/random_joke';
		const jokeAPI = await axios.get<IjokeAPI>(jokeURL, {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		});

		const embed = new EmbedBuilder()
			.setTitle(jokeAPI.data.type)
			.setAuthor({ name: `${user.globalName}`, iconURL: user.displayAvatarURL({ size: 512 }) })
			.addFields([
				{
					name: '**Setup:**',
					value: `\`${jokeAPI.data.setup}\``,
					inline: false
				},
				{
					name: '**Punchline**',
					value: `\`${jokeAPI.data.punchline}\``,
					inline: false
				}
			])
			.setFooter({ text: `JokeID: ${jokeAPI.data.id}` });

		if (jokeAPI.data.type === 'general') { embed.setColor('Red'); }
		if (jokeAPI.data.type === 'programming') { embed.setColor('Green'); }
		if (jokeAPI.data.type === 'knock-knock') { embed.setColor('Blue'); }
		const mDEL = await interaction.editReply({ content: 'Joke Incoming' });

		setTimeout(async () => {
			await mDEL.delete();
			const m = await interaction.followUp({ embeds: [embed] });
			const r = await interaction.fetchReply(m.id);
			await r.react('🤣');
			await r.react('😆');
		}, 2000);
	}
});
