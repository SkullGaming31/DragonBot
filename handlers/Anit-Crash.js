const chalk = require('chalk');

/* module.exports = async (client) => {
	process.on('unhandledRejection', (reason, p) => {
		console.log(chalk.green('unhandledRejection') + ' ' + chalk.blue('Anti Crash Ignoring It') + chalk.red('!!'));
		console.log(reason, p);
	});
	process.on('uncaughtException', (err, origin) => {
		console.log(chalk.green('uncaughtException') + ' ' + chalk.blue('Anti Crash Ignoring It') + chalk.red('!!'));
		console.log(err, origin);
	});
	process.on('uncaughtExceptionMonitor', (err, origin) => {
		console.log(chalk.green('uncaughtExceptionMonitor') + ' ' + chalk.blue('Anti Crash Ignoring It') + chalk.red('!!'));
		console.log(err, origin);
	});
	process.on('multipleResolves', (type, promise, reason) => {
		console.log(chalk.green('multipleResolves') + ' ' + chalk.blue('Anti Crash Ignoring It') + chalk.red('!!'));
		console.log(type, promise, reason);
	});
}; */

const { MessageEmbed, WebhookClient, Guild } = require('discord.js'); // Importing MessageEmbed from Discord.js
const { inspect } = require('util');
const config = require('../Structures/config');
const s = new WebhookClient({
	id: config.DISCORD_ERR_WEBHOOK_ID,
	token: config.DISCORD_ERR_WEBHOOK_TOKEN,
});

module.exports = (client) => {
	client.on('error', err => {
		// const a = client.channels.cache.get(config.ERROR_LOG_CHANNEL)
		console.log(err);
		const ErrorEmbed = new MessageEmbed()
			.setTitle('Error')
			.setURL('https://discordjs.guide/popular-topics/errors.html#api-errors')
			.setColor('#2F3136')
			.setDescription(`\`\`\`${inspect(err, { depth: 0 })}\`\`\``)
			.setFooter({ text: `${Guild.name}` })
			.setTimestamp();
		return s.send({ embeds: [ErrorEmbed] });
	});
	process.on('unhandledRejection', (reason, p) => {
		// const b = client.channels.cache.get(config.ERROR_LOG_CHANNEL)
		console.log(reason, p);
		const unhandledRejectionEmbed = new MessageEmbed()
			.setTitle('**🟥 There was an Unhandled Rejection/Catch 🟥**')
			.setURL('https://nodejs.org/api/process.html#event-unhandledrejection')
			.setColor('RED')
			.addField('Reason', `\`\`\`${inspect(reason, { depth: 0 })}\`\`\``.substring(0, 1000))
			.addField('Promise', `\`\`\`${inspect(p, { depth: 0 })}\`\`\``.substring(0, 1000))
			.setFooter({ text: `${Guild.name}` })
			.setTimestamp();
		return s.send({ embeds: [unhandledRejectionEmbed] });
	});

	process.on('uncaughtException', (err, origin) => {
		// const c = client.channels.cache.get(config.ERROR_LOG_CHANNEL)
		console.log(err, origin);
		const uncaughtExceptionEmbed = new MessageEmbed()
			.setTitle('**🟥There was an Uncaught Exception/Catch 🟥**')
			.setColor('RED')
			.setURL('https://nodejs.org/api/process.html#event-uncaughtexception')
			.addField('Error', `\`\`\`${inspect(err, { depth: 0 })}\`\`\``.substring(0, 1000))
			.addField('Origin', `\`\`\`${inspect(origin, { depth: 0 })}\`\`\``.substring(0, 1000))
			.setFooter({ text: `${Guild.name}` })
			.setTimestamp();
		return s.send({ embeds: [uncaughtExceptionEmbed] });
	});

	process.on('uncaughtExceptionMonitor', (err, origin) => {
		// const d = client.channels.cache.get(config.ERROR_LOG_CHANNEL)
		console.log(err, origin);
		const uncaughtExceptionMonitorEmbed = new MessageEmbed()
			.setTitle('**🟥 There was an Uncaught Exception Monitor 🟥**')
			.setColor('RED')
			.setURL('https://nodejs.org/api/process.html#event-uncaughtexceptionmonitor')
			.addField('Error', `\`\`\`${inspect(err, { depth: 0 })}\`\`\``.substring(0, 1000))
			.addField('Origin', `\`\`\`${inspect(origin, { depth: 0 })}\`\`\``.substring(0, 1000))
			.setFooter({ text: `${Guild.name}` })
			.setTimestamp();
		return s.send({ embeds: [uncaughtExceptionMonitorEmbed] });
	});

	process.on('multipleResolves', (type, promise, reason) => {
		// const e = client.channels.cache.get(config.ERROR_LOG_CHANNEL)
		console.log(type, promise, reason);
		const multipleResolvesEmbed = new MessageEmbed()
			.setTitle('**🟥 There was an Multiple Resolve 🟥**')
			.setURL('https://nodejs.org/api/process.html#event-multipleresolves')
			.setColor('RED')
			.addField('Type', `\`\`\`${inspect(type, { depth: 0 })}\`\`\``.substring(0, 1000))
			.addField('Promise', `\`\`\`${inspect(promise, { depth: 0 })}\`\`\``.substring(0, 1000))
			.addField('Reason', `\`\`\`${inspect(reason, { depth: 0 })}\`\`\``.substring(0, 1000))
			.setFooter({ text: `${Guild.name}` })
			.setTimestamp();
		return s.send({ embeds: [multipleResolvesEmbed] });
	});

	process.on('warning', (warn) => {
		// const f = client.channels.cache.get(config.ERROR_LOG_CHANNEL)
		console.log(warn);
		const warningEmbed = new MessageEmbed()
			.setTitle('**🟥 There was an Uncaught Exception Monitor Warning 🟥**')
			.setColor('RED')
			.setURL('https://nodejs.org/api/process.html#event-warning')
			.addField('Warn', `\`\`\`${inspect(warn, { depth: 0 })}\`\`\``.substring(0, 1000))
			.setFooter({ text: `${Guild.name}` })
			.setTimestamp();
		return s.send({ embeds: [warningEmbed] });
	});

};
