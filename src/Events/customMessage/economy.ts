import { ChannelType, Message, userMention } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { IUser, UserModel } from '../../Database/Schemas/userModel';
import { Event } from '../../Structures/Event';

const BASE_CURRENCY_CHANCE = 0.1;
const SUBSCRIBER_CHANCE_BOOST = 0.05;

export default new Event('messageCreate', async (message: Message) => {
	const { author, guild } = message;

	// Ignore bot messages and DMs
	if (author.bot || !guild) return;

	// Determine currency chance based on subscriber status
	const isSubscriber = message.member?.roles.cache.some((role) => role.name === 'Twitch Subscriber');
	const currencyChance = isSubscriber ? BASE_CURRENCY_CHANCE + SUBSCRIBER_CHANCE_BOOST : BASE_CURRENCY_CHANCE;

	// Award currency if random chance is met
	if (Math.random() <= currencyChance) {
		try {
			const userId = author.id;

			// Generate random currency amount (10-300)
			const currencyAmount = Math.floor(Math.random() * 291) + 10;

			// Retrieve or create user model
			await UserModel.findOneAndUpdate<IUser>(
				{ guildID: guild.id, id: userId },
				{ $inc: { balance: currencyAmount } },
				{ new: true, upsert: true }
			);

			// Notify user about earned currency
			const settings = await SettingsModel.findOne({ GuildID: guild.id });
			const econChannel = settings?.EconChan ? guild.channels.cache.get(settings.EconChan) : undefined;

			const channelForNotification = econChannel || message.channel;

			await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay 1 second
			if (channelForNotification.type === ChannelType.GuildText) await channelForNotification.send({ content: `Hey ${userMention(author.id)}, you just earned ${currencyAmount} gold!` });
		} catch (error) {
			console.error('Error updating user currency:', error);
			// Handle errors appropriately
		}
	}
});
