const { CommandInteraction, MessageEmbed } = require('discord.js');
const axios = require('axios').default;

module.exports = {
	name: 'dadjoke',
	description: 'Display a Dad joke in the chat',
	permission: 'SEND_MESSAGES',

	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { user } = interaction;

		const options = {
			method: 'GET',
			url: 'https://icanhazdadjoke.com/',
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'Discord Bot (https://github.com/skullgaming31/skulledbotDiscord)' // set this to your discord bot link so they have a record of whos using there api.
			}
		};

		const response = await axios.request(options);
		// console.log(response.data); // debugging to find where the joke is actually givin to us, they give a Data object that gives the joke id, the joke itself and a status

		const dadJoke = new MessageEmbed()
			.setColor('RANDOM')
			.setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ dynamic: true, size: 512 })}` })
			.setThumbnail(`${user.displayAvatarURL({ dynamic: true, size: 512 })}`)
			.setDescription(`${response.data.joke}`)
			.setFooter({ text: 'docs for api (https://icanhazdadjoke.com/api)' });

		interaction.reply({ embeds: [dadJoke] });
	}
};