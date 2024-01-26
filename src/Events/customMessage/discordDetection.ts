import { randomBytes } from 'crypto';
import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import WarningDB from '../../Database/Schemas/WarnDB'; // Update the import to your new WarningDB schema
import { Event } from '../../Structures/Event';

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	if (!message.guild) return;
	const { channel, author, member, guild } = message;
	if (author.bot) return;

	// If the user is an admin, don't delete their message
	if (author.id === guild?.ownerId) return;
	if (channel.id === '1068334501991809135' || channel.id === '959693430647308292') return;

	// Find or create a document for the user in the database
	let userWarning = await WarningDB.findOne({ GuildID: guild.id, UserID: author.id });

	// If the document doesn't exist, create it with a warning count of 0
	if (!userWarning) {
		userWarning = await WarningDB.create({
			GuildID: guild.id,
			UserID: author.id,
			Warnings: [],
		});
	}

	// Get the user's current warning count from the database
	const warningCount = userWarning.Warnings.length;

	const discordInviteRegex = /(discord\.(gg|com|io|me|gift)\/.+|discordapp\.com\/invite\/.+)/gi;
	const isDiscordInvite = discordInviteRegex.test(message.content);

	if (isDiscordInvite) {
		const discordLinkDetection = new EmbedBuilder()
			.setTitle('Discord Link Detected')
			.setDescription(`:x: ${author} **Do not post Discord links in this server.**`)
			.setColor('Red')
			.setAuthor({ name: `${author.globalName}`, iconURL: author.displayAvatarURL({ size: 512 }) })
			.setThumbnail(author.displayAvatarURL())
			.setFooter({ text: `UserID: ${author.id}`, iconURL: author.displayAvatarURL({ size: 512 }) })
			.setTimestamp();

		let warningMessage = '';

		if (channel.id === '959693430647308292') {
			// Moderator Channel
			warningMessage = 'This is a moderator channel.';
		} else if (channel.type === ChannelType.GuildText) {
			// Non-moderator channel
			warningMessage = 'You have posted a Discord link.';

			// Handle warnings and actions here
			// You can use a switch statement to determine the appropriate action
			switch (warningCount) {
				case 0:
					// First warning
					warningMessage = 'This is your first warning. Please do not post Discord links in this server.';
					break;
				case 1:
					// Second warning
					if (member?.moderatable) {
						// Send a DM to the user
						// await member?.timeout(30000, 'posted link for a discord server after being warned');// 5 minutes = 300000
						await member?.send({ embeds: [discordLinkDetection.setDescription(warningMessage)] })
							.catch((error) => {
								console.error(`Failed to send a DM to ${author.globalName}: ${error.message}`);
							});
					}
					break;
				case 2:
					// Third warning
					if (member?.kickable) {
						// Send a DM to the user
						// await member?.kick('Posted a discord link after being warned twice for posting links');
						await member?.send({ embeds: [discordLinkDetection.setDescription(warningMessage)] })
							.catch((error) => {
								console.error(`Failed to send a DM to ${author.globalName}: ${error.message}`);
							});
					}
					break;
				case 3:
					// Third warning
					if (member?.bannable) {
						// Send a DM to the user
						// await member?.ban({ reason: 'Posting discord links after being told 3 times not to post them', deleteMessageSeconds: 5 });
						await member?.send({ embeds: [discordLinkDetection.setDescription(warningMessage)] })
							.catch((error) => {
								console.error(`Failed to send a DM to ${author.globalName}: ${error.message}`);
							});
					}
					break;
			}

			// Create a new warning object
			const newWarning = {
				WarningID: generateUniqueID(), // Generate a unique ID for the new warning
				Reason: 'Posting Discord links',
				Source: 'bot'
			};

			// Add the new warning to the user's warnings array
			userWarning.Warnings.push(newWarning);

			// Save the updated warnings array to the database
			await userWarning.save();

			// Send the warning message in the channel
			await message.reply({ content: `${author}`, embeds: [discordLinkDetection.setDescription(warningMessage)] });
			console.log('Before message deletion');
			await message.delete().catch((error) => { console.error(`Failed to delete message: ${error.message}`); });
			console.log('After message deletion');
		}

		// Log or perform additional actions as needed
		console.log(warningMessage, 'Warning Count: ' + (warningCount + 1));
	}
});

// Function to generate a random unique ID
function generateUniqueID(): string { return randomBytes(8).toString('hex'); }