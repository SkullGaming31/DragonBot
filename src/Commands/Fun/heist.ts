import { randomInt } from 'crypto';
import { ApplicationCommandOptionType, ApplicationCommandType, Collection, EmbedBuilder, GuildTextBasedChannel, TextChannel, channelMention, userMention } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

interface Participant {
	userId: string; // User ID for future reference
	username: string; // Username for display purposes
}

export default new Command({
	name: 'heist',
	description: 'Start a heist with friends',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'amount',
			description: 'The amount you want to bet on the heist! 1000-10000',
			type: ApplicationCommandOptionType.Number,
			required: true,
		},
		{
			name: 'zone',
			description: 'The Zone(Difficulty) you want to play the heist in',
			type: ApplicationCommandOptionType.String,
			required: false,
			choices: [
				{ name: 'bank', value: 'bank' },
				{ name: 'museum', value: 'museum' },
				{ name: 'casino', value: 'casino' },
				{ name: 'jewelry store', value: 'jewelry store' },
			]
		}
	],
	run: async ({ interaction }) => {
		const { options } = interaction;
		try {
			await interaction.deferReply();

			const Amount = options.getNumber('amount');
			if (!Amount) return;
			if (Amount < 1000 || Amount > 10000) return interaction.editReply({ content: 'The bet amount must be between 1000-10000' });
			const econChannel = interaction.guild?.channels.cache.get('1214134334093664307');
			if (interaction.channel?.id !== econChannel?.id) return interaction.editReply({ content: `All economy commands should be used in ${channelMention('1214134334093664307')}` });

			// Initialize variables (implement your logic here)
			const heistInProgress = false;
			const participants: Collection<string, Participant> = new Collection();

			let heistStage = 1;
			const baseChance = 0.1; // 10% base chance
			const participantBonus = 0.05; // 5% chance increase per participant
			// Declare a Map to store participant IDs and their corresponding join message IDs
			const joinMessagesMap = new Map();

			// Check if a heist is already in progress (implement your logic here)
			if (heistInProgress) return interaction.editReply({ content: 'A heist is already in progress. Please wait for it to finish!' });

			// Start heist message with reaction and collector
			const heistMessage = await interaction.editReply({ content: '**Heist starting in 30 seconds! React with ✅ to participate.**' });
			const heistMessageDetails = await heistMessage.fetch();
			await heistMessageDetails.react('✅');

			try {
				const filter = { id: interaction.user.id };
				const update = { $inc: { balance: -Amount } }; // Deduct Amount
				const options = { new: true };
				await UserModel.findOneAndUpdate(filter, update, options);
			} catch (error) {
				console.error('Failed to deduct bet amount from interaction user:', error);
			}

			const collector = heistMessageDetails.createReactionCollector({
				filter: (reaction, user) => !user.bot, // Simplified filter for remaining reactions
				time: 30000,
			});

			collector.on('collect', async (reaction, user) => {
				if (user.bot) return; // Ignore bot reactions
				// console.log('Reaction Count: ', reaction.count);

				// Ensure the user is not a bot and the reaction is the ✅ emoji
				if (user.bot || reaction.emoji.name !== '✅') {
					return; // Ignore bot reactions and other emojis
				}

				const participant: Participant = {
					userId: user.id,
					username: user.username,
					// ... assign other participant information ...
				};
				participants.set(user.id, participant);

				// Send message to channel
				const channel = (reaction.message.channel as TextChannel);
				if (channel) {
					const participantJoinMessage = await channel.send({ content: `${userMention(user.id)} has joined the heist!` });

					// Add participant ID and join message ID to a map for future reference
					joinMessagesMap.set(user.id, participantJoinMessage.id);
					// for (const [participantId, participant] of participants) {
					// 	console.log(`ParticipantID: ${participantId}, ${participant.username}, has joined the heist!`);
					// }
				} else {
					console.warn('Unable to send message, channel not found.');
				}
			});
			collector.on('remove', async (reaction, user) => {
				if (!user.bot && reaction.emoji.name === '✅') {
					// Check for user's presence in the participants collection
					const participant = participants.get(user.id);

					if (participant) {
						// User found in participants, remove from collection and update message
						console.log(`${user.username} unreacted, removing from participants.`);
						participants.delete(user.id);
						await interaction.editReply({ content: `${user.globalName} has backed out of the heist` });
					} else {
						// User not found in participants, handle potential other scenarios (optional)
						console.log(`${user.username} unreacted but wasn't in participants.`);
						// You might want to handle cases where a user un reacts but wasn't part of the heist.
					}
				} else {
					// Ignore bot reactions and other emoji removals
					console.log(`${user.username} removed unhandled reaction.`);
				}
			});

			collector.on('end', async () => {
				// Check for enough participants
				if (participants.size < 2) {
					await interaction.editReply({ content: 'Not enough participants joined. Heist cancelled!' });
					return;
				}

				// Start the heist loop (implement your logic here)
				while (heistStage <= 1) { // Replace 5 with the number of heist stages
					// Send messages describing the heist stage (implement your logic here)
					await interaction.editReply({ content: `**Heist Stage ${heistStage}:**` });

					// Introduce challenges or obstacles (implement your logic here)
					// Use random elements or user input to determine success/failure

					// Update heist stage (implement your logic here)
					heistStage++;
				}

				// Inside the heist loop or a separate function:

				// Calculate success chance without a cap
				const successChance: number = baseChance + (participants.size * participantBonus);

				// Generate a random integer between 1 and 100
				const randomValue: number = randomInt(1, 100);

				// Determine success or failure based on random value and success chance
				const success: boolean = randomValue <= successChance * 100;

				// Announce the heist outcome (implement your logic here)
				// await interaction.editReply({ content: '**Heist completed!** (Announce the outcome based on success/failure)' });
				const textChannel = interaction.channel as GuildTextBasedChannel; // Type assertion
				if (!heistInProgress) {
					await heistMessage.reactions.removeAll();
					// Convert map values to an array of message IDs
					const messageIdsToDelete = Array.from(joinMessagesMap.values());

					// Attempt to bulk delete messages
					if (textChannel) {
						try {
							await textChannel.bulkDelete(messageIdsToDelete, true).catch((err) => { console.error(err); });
						} catch (error) {
							console.error('Failed to bulk delete messages:', error);

							// Fallback to individual deletion
							for (const messageId of messageIdsToDelete) {
								try {
									await interaction.channel?.messages.fetch(messageId).then(message => message.delete());
								} catch (error) {
									console.error('Failed to delete message:', error);
								}
							}
						}
					}
				}
				// Announce outcome
				if (success) {
					console.log('The heist is successful!');
					// Check if there are participants before picking winners
					if (participants.size > 0) {
						// Determine the number of winners based on your logic (replace with your calculation)
						const numWinners = Math.min(Math.floor(Math.random() * participants.size) + 1, participants.size); // grab a random number between 1 and participants.size

						// Convert Collection to array, shuffle, and select winners
						const participantArray = Array.from(participants.values()); // Create array from Collection values
						participantArray.sort(() => Math.random() - 0.5); // Shuffle using random sort
						const winners = participantArray.slice(0, numWinners); // Select first 'numWinners' elements

						// Announce the winners
						let winnerString = '';
						for (const winner of winners) {
							const filter = { id: winner.userId };
							const update = { $inc: { balance: Amount } }; // Award Amount
							const options = { new: true };
							await UserModel.findOneAndUpdate(filter, update, options);
							winnerString += `${userMention(winner.userId)} `; // Access the participant's userId
						}
						const embed = new EmbedBuilder()
							.setTitle('Heist Winners')
							.setDescription(winnerString)
							.setTimestamp();
						await interaction.editReply({ content: '**Heist completed!**', embeds: [embed] });
						participants.clear();
					} else {
						console.log('No participants in the heist.');
						await textChannel.send('There were no participants in the heist.');
						participants.clear();
					}
				} else {
					console.log('the heist has failed');
					await interaction.editReply({ content: '**Heist completed!** The heist has failed, Everyone Loses' });
				}
			});
		} catch (error) {
			console.error(error);
		}
	},
});