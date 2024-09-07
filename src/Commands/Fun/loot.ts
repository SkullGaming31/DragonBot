/* eslint-disable no-case-declarations */
import { randomInt } from 'crypto';
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonInteraction, ButtonStyle, Collection, CommandInteraction, ComponentType, TextChannel, userMention } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

const houseItems: {
	tv: number;
	console: number;
	computer: number;
	laptop: number;
	cash: number;
	jewelry: number; // Added jewelry
	art: number; // Added art
	silverware: number; // Added silverware
	[key: string]: number; // Index signature allowing string keys
} = {
	tv: 1000,
	console: 800,
	computer: 1200,
	laptop: 1500,
	cash: 2000,
	jewelry: 2500, // Added value for jewelry
	art: 3000, // Added value for art
	silverware: 500, // Added value for silverware
};

// const personItems: {
// 	watch: number;
// 	jewelry: number;
// 	cash: number;
// } = {
// 	watch: 500,
// 	jewelry: 1500,
// 	cash: 1000,
// };

const cashRegisterMin = 200;
const cashRegisterMax = 2000;

interface StoreItems {
	[key: string]: number;
}

const storeItems: StoreItems = {
	cashRegister: randomInt(cashRegisterMin, cashRegisterMax),
	food: 200,
	drink: 150,
	personalBelongings: 1000,
};

// const successOdds: { [item: string]: number } = {
// 	lockpick: 0.3,         // 30% success rate
// 	disguise: 0.2,         // 20% success rate
// 	getawayCar: 0.5,    // 50% success rate
// 	flashlight: 0.1,       // 10% success rate
// 	hackingDevice: 0.4,    // 40% success rate
// };

export default new Command({
	name: 'loot',
	description: 'Loot to get quick cash',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'target',
			description: 'gamble [all, %, fixed number] fixed number = betamount',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'house', value: 'house' },
				{ name: 'store', value: 'store' },
				{ name: 'person', value: 'person' },
			]
		}
	],
	run: async ({ interaction }) => {
		const { user, options, guild } = interaction;
		const robberyTarget = options.getString('target');
		await interaction.deferReply();
		// const chosenItems = interaction.options.getString('items')?.split(' ');// not needed for time being as items havnt been implemented yet

		// Check if a robbery target is specified
		if (!robberyTarget) {
			return interaction.editReply({ content: 'Please specify a robbery target.', });
		}

		// Perform the robbery based on the target
		let robberyAmount = 0;
		let stolenItems: string[] = [];

		switch (robberyTarget) {
			case 'house':
				// Calculate the total value of items in the house
				const houseValue = Object.values(houseItems).reduce((total, value) => total + value, 0);

				// Randomly select 1-4 items without introducing new variables
				stolenItems = Object.keys(houseItems)
					.sort(() => Math.random() - 0.5)
					.slice(0, Math.floor(Math.random() * 4) + 1);

				// Check if any items were stolen
				if (stolenItems.length === 0) {
					return interaction.editReply({ content: 'You couldn\'t find anything valuable to steal.' });
				}

				// Calculate total value of stolen items
				const totalStolenValue = stolenItems.reduce((total, item) => total + houseItems[item], 0);

				// Update user's balance with stolen value
				const userId = interaction.user.id;
				try {
					const user = await UserModel.findOne({ guildID: guild?.id, id: userId });

					if (user && user.balance !== undefined) {
						user.balance = user.balance + totalStolenValue;
						await user.save(); // Update balance and save to database
						console.log(`Updated user balance to: ${user.balance}`);
					} else {
						console.error('Couldn\'t find user to update balance.');
					}
				} catch (error) {
					console.error('Error updating user balance:', error);
				}

				// Announce stolen items and their value along with total house value
				const formattedItems = stolenItems.map(item => `${item} (${houseItems[item]} gold)`);
				await interaction.editReply({ 
					content: `You stole ${formattedItems.join(', ')} from the house, totaling ${totalStolenValue} gold! The total possible value in the house was ${houseValue} gold.` 
				});
				break;
				case 'person':
    try {
        // Retrieve users from the database
        const usersInDB = await UserModel.find({ guildID: guild?.id });

        if (usersInDB.length === 0) {
            return interaction.editReply({ content: 'No users are registered in the database.' });
        }

        // Filter out the guild members who are present in the database
        const validMembers = guild?.members.cache.filter(member => 
            !member.user.bot && usersInDB.some(user => user.id === member.id)
        );

        if (validMembers?.size === 0) {
            return interaction.editReply({ content: 'No valid users to rob.' });
        }

        // Randomly select a user from valid members
        const member = validMembers?.random();
        if (!member) throw new Error('No member found.');

        const userId = member.id;

        // Retrieve the user model
        const user = await UserModel.findOne({ guildID: guild?.id, id: userId });

        if (!user) {
            return interaction.editReply({ content: 'The robbery attempt failed because the target user is not registered in the database.' });
        }

        if (user.id === interaction.user.id) return interaction.editReply({ content: 'You can\'t rob yourself.' });

        // Calculate the robbery amount
        robberyAmount = randomInt(1, 15); // Take a random percentage between 1-15%

        // Check if the robbery amount is valid
        if (robberyAmount === 0) { return interaction.editReply({ content: 'There are no eligible users to rob at the moment.' }); }

        // Check if the member is attempting to block the robbery
        const blockChance = randomInt(1, 100); // Random number to determine if the block is successful
        if (blockChance <= 20) { // 20% chance of successful block
            return interaction.editReply({ content: `${member.user.username} blocked your robbery attempt!` });
        }

        // Create a row for the button
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('block')
                    .setLabel('Block')
                    .setStyle(ButtonStyle.Danger)
            );

        // Ensure userId is defined
        if (userId) {
            // Send the message with the button
            await interaction.editReply({ content: `${userMention(userId)}, you are being robbed, you have 30 seconds to click the \`block\` button to stop them from stealing some of your gold`, components: [row] });
        } else {
            return interaction.editReply({ content: 'An error occurred: User ID is undefined.' });
        }

				const textChannel = interaction.channel as TextChannel;

        // Await the interaction with the button
        const collector = textChannel.createMessageComponentCollector({
            filter: (interaction) => interaction.isButton() && interaction.user.id === member.id && interaction.customId === 'block',
            time: 30000,
        });

        if (collector === undefined) return;

        collector.on('collect', async (interaction: ButtonInteraction) => {
            // The person blocked the robbery
            if (interaction.componentType === ComponentType.Button) {
                collector.stop();
                await interaction.reply({ content: 'You blocked the robbery attempt!', components: [] });
            }
        });

        collector.on('end', async (collected: Collection<string, ButtonInteraction>) => {
            if (collected.size === 0) {
                // The person did not respond, continue with the robbery
                user.balance -= robberyAmount;
                await user.save();
                await interaction.editReply({ content: `You successfully robbed ${userMention(member.user.id)} and gained ${robberyAmount} gold.`, components: [] });
            }
        });

        // Update the user's balance by deducting the robbery amount
        user.balance -= robberyAmount; // Move this line outside the collector's end event
        await user.save(); // Move this line outside the collector's end event

    } catch (error) {
        console.error(error);
        return interaction.editReply({ content: 'An error occurred while attempting to rob a user.' });
    }
    break;
			case 'store':
				try {
					// Select random items from the store if no specific items are chosen
					const discordUser = await UserModel.findOne({ guildID: guild?.id, id: user.id });
					if (!discordUser) throw new Error('User not found.'); // Added error handling

					const itemsToSteal = Object.keys(storeItems); // Get all item names
					const numItemsToSteal = Math.min(3, itemsToSteal.length);

					stolenItems = [];

					// Loop for guaranteed 1 item selection
					for (let i = 0; i < Math.min(1, numItemsToSteal); i++) {
						const randomItemIndex = randomInt(0, itemsToSteal.length - 1);
						const randomItem = itemsToSteal.splice(randomItemIndex, 1)[0]; // Remove selected item from the array
						stolenItems.push(randomItem);
					}

					// Optional loop for additional random items (up to 2)
					for (let i = 1; i < numItemsToSteal; i++) {
						const randomItemIndex = randomInt(0, itemsToSteal.length - 1);
						const randomItem = itemsToSteal.splice(randomItemIndex, 1)[0]; // Remove selected item from the array
						stolenItems.push(randomItem);
					}

					// Check if stolen items exist
					if (stolenItems.length === 0) {
						return interaction.editReply({ content: 'You were unable to steal any valid items.', });
					}

					// Calculate the total value of stolen items
					const stolenValue = stolenItems.reduce((total, item) => total + (storeItems[item] || 0), 0);

					// Add stolen value to user's balance
					discordUser.balance += stolenValue;
					await discordUser.save();

					// Send message if items were stolen
					const stolenItemsList = stolenItems.join(', ');
					await interaction.editReply({ content: `You stole ${stolenItemsList} totaling ${stolenValue} gold!`, });
				} catch (error) {
					console.error(error);
					return interaction.editReply({ content: 'An error occurred while attempting to steal from the store.', });
				}
				break;
		}
	},
});