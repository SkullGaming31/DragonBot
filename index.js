const { Client, Intents, Collection, Guild, GuildMember, MessageEmbed } = require('discord.js');
require('dotenv').config();
// const fs = require('fs');
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
	],
});
client.commands = new Collection();

//  ready event
client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}`);
});

// Someone Joins the Discord Server
client.on('guildMemberAdd', (message) => {
	if (message.channel.type === 'DM' || message.author.bot) return;
	/*
	needs to test the welcome/welcome embed sending to the correct channel.
	welcome message with embed
	assign Role to all members that join
	send the welcome message to the #welcome channel
	*/
	const rules = message.guild.channels.cache.get('885315675713830912'); // rulesChannel ID
	const welcome = message.guild.channel.cache.get('883535013684056165'); // welcome Channel ID
	const guildName = Guild.name;
	const welcomeEmbed = new MessageEmbed()
		.setTitle(`WELCOME to ${guildName}`)
		.setDescription(`${message.author.tag}, **Welcome to ${guildName}, please read all the rules in the rules channel ${rules} channel**`)
		.setColor('RED')
		.setFooter('Overlay Expert')
		.addFields({
			name: 'MemberCount: ',
			value: Guild.memberCount(),
		})
		.setThumbnail(message.author.avatarURL());
	message.reply({ content: ' ', embeds: [welcomeEmbed] });

	GuildMember.role.add('883536758749429760').send(welcome);
});

// messages sent in the discord server
client.on('messageCreate', async (message) => {
	console.log(`${message.author.username} said: ${message.content}`);

	if (message.channel.type === 'DM' || message.author.bot) return;
	const guildName = message.guild.name;
	const mentionedMember = message.mentions.members.first();
	const adminRole = message.guild.roles.cache.get('899658881490374707'); // Admin Role ID
	const modRole = message.guild.roles.cache.get('899658962880835624'); // Moderator Role ID
	const ownerRole = message.guild.roles.cache.get('883536958595411968');// Owner Role ID
	if (mentionedMember) { // Anti-Ping System works
		if (mentionedMember.roles.cache.has(adminRole.id) || mentionedMember.roles.cache.has(modRole.id) || mentionedMember.roles.cache.has(ownerRole.id)) {
			const supportChannel = message.guild.channels.cache.get('899451865924763682'); // supportChannel ID
			const warning = new MessageEmbed()
				.setTitle('WARNING')
				.setDescription(`<@!${message.author.tag}>, **Please do not ping a mod or admin, leave your question in ${supportChannel} and when someone is free they will help you out, remember we all have lives to live aswell so please be patient, someone will get to you as soon as possible.**`)
				.setColor('RED')
				.setFooter(`${guildName}`)
				.setThumbnail(message.author.avatarURL());
			message.reply({ content: `${message.author.tag}`, embeds: [warning] });
		}
	}
	if (!message.member.roles.cache.has(adminRole.id) || !message.member.roles.cache.has(modRole.id)) {
		const regex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|club)|discord\.com\/invite|discord\.com\/invite)\/.+[a-z]/gi;
		if (regex.exec(message.content)) {
			await message.delete({ timeout: 1000 });
			await message.channel.send(
				`:x: ${message.author} **you cannot post invite links from other servers here!**`,
			);
		}
	}
});

client.on('interactionCreate', async (interaction) => {// commands are done in this code block
	if (interaction.channel.type === 'DM') return;
	console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
	if (!interaction.isCommand()) return;

	// const command = interaction.client.commands.get(interaction.commandName); // this will read commands from there own .js file

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('**Pong!**');
	}
	else if (commandName === 'server') {
		await interaction.reply(`**Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}**`);
	}
	else if (commandName === 'user') {
		await interaction.reply(`**Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}**`);
	}

	// will load commands in there own file below
	/* try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}*/
});

// use to read commands from here but same issue that was having with loading events.
/* const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

// used to load events from an events folder but was having issues with intelisense
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
} */

client.login(process.env.TOKEN);