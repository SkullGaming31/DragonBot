import { ChannelType, Message, userMention } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Event } from '../../Structures/Event';

// Set a random chance (e.g., 0.05 5%) for awarding currency
const CURRENCY_CHANCE = 0.2;
const SUBSCRIBER_CHANCE = 0.25;
export default new Event('messageCreate', async (message: Message) => {
	const { author, guild } = message;
	if (author.bot && !guild) return; // Ignore bot messages

	// Generate a random number between 0 and 1
	const randomValue = Math.random();

	// Check if the random number falls within the currency chance
	const isSubscriber = message.member?.roles.cache.some(role => role.name === 'Twitch Subscriber'); // Check for subscriber role

	if (isSubscriber) {
		// Use subscriber chance for subscribers
		if (randomValue <= SUBSCRIBER_CHANCE) {
			// Existing code to award currency and update user balance (replace with your actual implementation)
			console.log(`${author.username} (subscriber) earned currency!`);

			// Example: Update user balance in your database
			const userId = author.id;
			const username = author.username;
			const currencyAmount = Math.floor(Math.random() * (300 - 10 + 1)) + 10;

			try {
				let user = await UserModel.findOne({ id: userId });
				if (!user) {
					user = new UserModel({ id: userId, username, balance: 0 });
				}
				if (!author.bot) {
					user.balance += currencyAmount;
					await user.save();

					const econChannel = message.guild?.channels.cache.get('1214134334093664307'); // Replace with your channel ID
					if (econChannel?.type === ChannelType.GuildText) {
						await econChannel.send({ content: `Hey ${userMention(author.id)}, you just earned ${currencyAmount} gold as a subscriber!` });
					}
				}
			} catch (error) {
				console.error('Error updating user currency:', error);
			}
		}
	} else {
		// Use regular chance for non-subscribers
		if (randomValue <= CURRENCY_CHANCE) {
			const userId = author.id;
			const username = author.username;

			// Generate a random currency amount between 10 and 300 (inclusive)
			const currencyAmount = Math.floor(Math.random() * (300 - 10 + 1)) + 10;

			// Find the user in the database or create a new entry if they don't exist
			try {
				// Find the user using a query for your custom string ID field
				let user = await UserModel.findOne({ id: userId });

				if (!user) {
					// Create a new user model with the correct field names
					user = new UserModel({ id: userId, username, balance: 0 });
				}

				if (!author.bot) {
					// Update the user's balance
					user.balance += currencyAmount;
					// Save the updated user data
					await user.save();

					// Inform the user about the earned currency
					const econChannel = message.guild?.channels.cache.get('1214134334093664307');
					if (econChannel?.type === ChannelType.GuildText) await econChannel.send({ content: `Hey ${userMention(author.id)}, you just earned ${currencyAmount} gold!` });
				}
			} catch (error) {
				console.error('Error updating user currency:', error);
				// Handle errors appropriately, e.g., log the error and consider retry logic
			}
		}
	}
});