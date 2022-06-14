const { CommandInteraction, Client, MessageEmbed } = require('discord.js');
const sourcebin = require('sourcebin');

const DB = require('../../Structures/Schemas/FilterDB');

module.exports = {
	name: 'filter',
	description: 'A simple chat filter system',
	permission: 'MANAGE_MESSAGES',
	public: true,
	options: [
		{
			name: 'help',
			description: 'display some help for this sub command',
			type: 'SUB_COMMAND'
		},
		{
			name: 'clear',
			description: 'clear all your words blacklist',
			type: 'SUB_COMMAND'
		},
		{
			name: 'list',
			description: 'list your blacklisted words',
			type: 'SUB_COMMAND'
		},
		{
			name: 'settings',
			description: 'setup your filtering system',
			type: 'SUB_COMMAND',
			options: [
				{
					name: 'logging',
					description: 'select the message logging channel',
					type: 'CHANNEL',
					channelTypes: ['GUILD_TEXT'],
					required: true
				}
			],
		},
		{
			name: 'configure',
			description: 'add or remove words from the blacklist',
			type: 'SUB_COMMAND',
			options: [
				{
					name: 'options',
					description: 'select an option',
					type: 'STRING',
					required: true,
					choices: [
						{ name: 'Add', value: 'add' },
						{ name: 'Remove', value: 'remove' }
					],
				},
				{
					name: 'word',
					description: 'Provide the word, add multiple words by placing a comma in between. (word,anotherword,athirdword)',
					type: 'STRING',
					required: true
				}
			],
		},
	],
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 * @param {Client} client 
	 */
	async execute(interaction, client) {
		const { guild, options } = interaction;
		await interaction.deferReply();

		const subCommand = options.getSubcommand();

		try {
			switch (subCommand) {
				case 'help':
					const Embed = new MessageEmbed()
						.setColor('GREEN')
						.setDescription(
							[
								'**How do i add or remove a word from the blacklist.**\nBy using /filter [configure] [add/remove] [word]',
								'**How do i clear my blacklist**\nBy using /filter [clear]',
								'**How do i list all my blacklisted words**\nBy using /filter [list]',
								'**How do i set my logging Channel**\n By using /filter [settings] [logging]'
							].join('\n'));
					interaction.editReply({ embeds: [Embed] });
					break;
				case 'clear':
					await DB.findOneAndUpdate({ Guild: guild.id }, { Words: [] });
					client.filters.set(guild.id, []);
					interaction.editReply({ content: 'cleared all words from the blacklist' });
					break;
				case 'list':
					const Data = await DB.findOne({ Guild: guild.id });
					if (!Data) return interaction.editReply({ content: 'there is no data to list', ephemeral: true });
					await sourcebin.create([
						{
							content: `${Data.Words.map((w) => w).join('\n') || 'none'}`,
							language: 'text',
						}
					],
						{
							title: `${guild.name} | Word Blacklist`,
							description: 'Word blacklist for the guild'
						}
					).then((bin) => {
						interaction.editReply({ content: bin.url });
					});
					break;
				case 'settings':
					const loggingChannel = options.getChannel('logging').id
					await DB.findOneAndUpdate({ Guild: guild.id }, { Log: loggingChannel }, { new: true, upsert: true });
					client.filtersLog.set(guild.id, loggingChannel);

					interaction.editReply({ content: `Added <#${loggingChannel}> as the logging channel for the filtering system`, ephemeral: true });
					break;
				case 'configure':
					const Choice = options.getString('options');
					const Words = options.getString('word').toLowerCase().split(',');

					switch (Choice) {
						case 'add':
							DB.findOne({ Guild: guild.id }, async (err, data) => {
								if (err) throw err;
								if (!data) {
									await DB.create({ Guild: guild.id, Log: null, Words: Words });

									client.filters.set(guild.id, Words);
									return interaction.editReply({ content: `Added ${Words.length} new word(s) to the blacklist` });
								}

								const newWords = [];

								Words.forEach((w) => {
									if (data.Words.includes(w)) return;
									newWords.push(w);
									data.Words.push(w);
									client.filters.get(guild.id).push(w);
								});
								interaction.editReply({ content: `Added ${newWords.length} new word(s) to the blacklist` });
								data.save();
							});
							break;
						case 'remove':
							DB.findOne({ Guild: guild.id }, async (err, data) => {
								if (err) throw err;
								if (!data) {
									return interaction.editReply({ content: 'there is no data to remove', ephemeral: true });
								}
								const removedWords = [];
								Words.forEach((w) => {
									if (!data.Words.includes(w)) return;
									data.Words.remove(w);
									removedWords.push(w);
								});
								const newArray = client.filters.get(guild.id).filter((word) => !removedWords.includes(word));

								client.filters.set(guild.id, newArray);
								interaction.editReply({ content: `Removed ${removedWords.length} word(s) from the blacklist` });
							});
							break;
					}
					break;
			}
		} catch (error) {
			console.error(error);
		}
	}
}