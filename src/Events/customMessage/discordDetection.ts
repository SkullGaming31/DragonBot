import { randomBytes } from 'crypto';
import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import WarningDB from '../../Database/Schemas/WarnDB'; // Update the import to your new WarningDB schema
import DB from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	try {
		if (!message.guild) return;
		const { channel, author, member, guild } = message;
		if (author.bot) return;

		// If the user is an admin, don't delete their message
		if (process.env.Enviroment !== 'dev' && process.env.Enviroment !== 'debug') {
			if (author.id === guild?.ownerId) return;
		}
		if (channel.id === '959693430647308292' || channel.id === '959693430647308292') return;

		// Find or create a document for the user in the database
		let userWarning = await WarningDB.findOne({ GuildID: guild.id, UserID: author.id });
		const SettingsDB = await DB.findOne({ GuildID: guild.id });

		if (!SettingsDB) return;

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
		console.log('WarningCount outside switch: ', warningCount);

		const discordInviteRegex = /(discord\.(gg|com|io|me|gift)\/.+|discordapp\.com\/invite\/.+)/gi;
		const isDiscordInvite = discordInviteRegex.test(message.content);
		// if (member?.permissions.has('ManageMessages')) return;

		if (isDiscordInvite) {
			const discordLinkDetection = new EmbedBuilder()
				.setTitle('Discord Link Detected')
				.setColor('Red')
				.setAuthor({ name: `${author.globalName}`, iconURL: author.displayAvatarURL({ size: 512 }) })
				.setThumbnail(author.displayAvatarURL())
				.setFooter({ text: `guild: ${guild.name}` })
				.setTimestamp();

			let warningMessage = '';
			
			if (channel.id === '959693430647308292' || channel.id === '959693430647308292') {
				return;
			} else if (channel.type === ChannelType.GuildText) {

				switch (warningCount) {
					case 0:
					// First warning
						warningMessage = 'This is your first warning. Please do not post Discord links in this server.';
						break;
					case 1:
					// Second warning
						warningMessage = 'This is your 2nd warning. Please do not post Discord links in this server. you have been muted for 5 minutes';
						if (member?.moderatable) {
							// Send a DM to the user
							// await member?.timeout(300000, 'posted link for a discord server after being warned');// 5 minutes = 300000
							await member?.send({ embeds: [discordLinkDetection.setDescription(warningMessage)] })
								.catch((error) => {
									console.error(`Failed to send a DM to ${author.globalName}: ${error.message}`);
								});
						}
						break;
					case 2:
					// Third warning
						warningMessage = 'This is your 3rd warning. DO NOT post Discord links in the server. you have been kicked from the server with the possiblity to rejoin';
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
						warningMessage = 'This is your 3rd warning. DO NOT post Discord links in the server. you have been Banned from the server with no possiblity to rejoin the server with this account';
						if (member?.bannable) {
						// Send a DM to the user
							// await member?.ban({ reason: 'Posting discord links after being told 3 times not to post them', deleteMessageSeconds: 5 });
							await member?.send({ embeds: [discordLinkDetection.setDescription(warningMessage)] })
								.catch((error) => {
									console.error(`Failed to send a DM to ${author.globalName}: ${error.message}`);
								});
						}
						break;
					default:
						console.log('WarningCount:', warningCount);
						break;
				}

				// Create a new warning object
				const newWarning = {
					WarningID: generateUniqueID(),
					Reason: 'Posting Discord Links',
					Source: 'bot'
				};

				// Add the new warning to the user's warnings array
				userWarning.Warnings.push(newWarning);

				// Save the updated warnings array to the database
				await userWarning.save();

				// Send the warning message in the channel
				console.log('Warning Message:', warningMessage);
				await message.reply({ content: `${author}`, embeds: [discordLinkDetection.setDescription(warningMessage)] });
				// Attempt to delete the message
				console.log('Before message deletion');
				await message.delete()
					.then(() => {
						console.log('Message deleted successfully');
					})
					.catch((error) => {
						console.error(`Failed to delete message: ${error.message}`);
					});
				console.log('After message deletion');
			}
		}
	} catch (error) {
		console.error(error);
	}
});

// Function to generate a random unique ID
function generateUniqueID(): string { return randomBytes(8).toString('hex'); }