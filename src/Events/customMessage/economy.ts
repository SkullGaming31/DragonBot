import { ChannelType, Message, userMention } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import TicketModel from '../../Database/Schemas/ticketDB';
import TicketSetupModel from '../../Database/Schemas/ticketSetupDB';
import { Event } from '../../Structures/Event';

const BASE_CURRENCY_CHANCE = 0.1;
const DEV_BASE_CURRENCY_CHANCE = 0.9;
const SUBSCRIBER_CHANCE_BOOST = 0.05;
const COOLDOWN_MS = 300_000; // 5 minutes
const DEV_USER_ID = '353674019943219204'; // Replace with your actual Discord ID

export default new Event('messageCreate', async (message: Message) => {
	const { author, guild, channel } = message;

	// Ignore bot messages, DMs, and non-text channels
	if (author.bot || !guild || channel.type !== ChannelType.GuildText) return;
	const userData = await UserModel.findOneAndUpdate({ guildID: guild.id, id: author.id });

	// Check if message is in allowed channels
	const settings = await SettingsModel.findOne({ GuildID: guild.id });

	// Developer bypass check
	const isDev = author.id === DEV_USER_ID;

	// Determine base chance (use DEV chance if developer)
	const baseChance = isDev ? DEV_BASE_CURRENCY_CHANCE : BASE_CURRENCY_CHANCE;

	// Check if message is in allowed channels (unless dev)
	if (!isDev) {
		const allowedChannels = ['skull-chat', 'economy-spam', 'lobby'];
		if (!allowedChannels.includes(channel.name)) return;
	}

	// Inside your messageCreate event
	const isSubscriber = message.member?.roles.cache.some(role => role.name === 'Twitch Subscriber');
	const rewardChance = baseChance + (isSubscriber ? SUBSCRIBER_CHANCE_BOOST : 0);

	// Bonus for long messages
	const isLongMessage = message.content.split(/\s+/).length > 20;
	const finalChance = isLongMessage ? rewardChance * 1.3 : rewardChance; // +30% chance for long messages

	// Award currency if random chance is met
	if (Math.random() <= finalChance) {
		try {
			const userId = author.id;

			// Generate random currency amount (10-300)
			let currencyAmount = Math.floor(Math.random() * 291) + 10;
			const isJackpot = false;

			// Subscriber bonus (+10% more gold)
			if (isSubscriber) currencyAmount = Math.floor(currencyAmount * 1.1);

			// Rare jackpot (1% chance)
			if (Math.random() <= 0.01) currencyAmount = Math.floor(Math.random() * 501) + 500;

			const lastReward = userData?.lastRewardTime; // Store this in your DB
			if (lastReward && Date.now() - lastReward < COOLDOWN_MS) return; // 5 min cooldown

			const words = message.content.split(/\s+/);
			if (words.length < 3 || words[0] === words[1]) return;

			// Long message bonus
			if (isLongMessage) currencyAmount = Math.floor(currencyAmount * 1.5);

			// Jackpot (higher chance for dev)
			const jackpotChance = isDev ? 0.7 : 0.01; // 50% vs 1%
			if (Math.random() <= jackpotChance) {
				currencyAmount = isDev
					? Math.floor(Math.random() * 5000) + 1000 // 1000-6000 for dev
					: Math.floor(Math.random() * 501) + 500; // 500-1000 for normal
			}

			// Update user balance and cooldown
			const updatedUser = await UserModel.findOneAndUpdate(
				{ guildID: guild.id, id: userId },
				{
					$inc: { balance: currencyAmount },
					$set: { lastRewardTime: Date.now() }
				},
				{
					new: true,
					upsert: true
				}
			);

			let notificationMessage: string;
			if (isJackpot) {
				notificationMessage = `🎰 **JACKPOT!** ${userMention(author.id)} won ${currencyAmount} gold! 🎉`;
			} else {
				notificationMessage = `Hey ${userMention(author.id)}, you earned ${currencyAmount} gold!`;
			}

			// Dev debug logging
			if (isDev) {
				notificationMessage += ' (DEV TEST)';
				console.log('[DEV] Economy debug:', {
					userId: author.id,
					awarded: currencyAmount,
					isJackpot,
					newBalance: updatedUser.balance
				});
			}

			// Notify user about earned currency
			const econChannel = settings?.EconChan ? guild.channels.cache.get(settings.EconChan) : undefined;

			// If message is in a ticket channel or inside the ticket category, don't post economy notifications directly there.
			// Prefer the configured econ channel; if none, skip notification to avoid spam in tickets.
			const ticketEntry = await TicketModel.findOne({ ChannelID: channel.id }).exec();
			const ticketSetup = await TicketSetupModel.findOne({ GuildID: guild.id }).exec();
			const isInTicketCategory = ticketSetup?.Category && channel.parentId === ticketSetup.Category;
			const isTicketChannel = !!ticketEntry || !!isInTicketCategory;

			let channelForNotification = econChannel;
			if (!channelForNotification && !isTicketChannel && channel.type === ChannelType.GuildText) channelForNotification = channel;

			await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay 1 second
			if (channelForNotification && typeof (channelForNotification as unknown as { send?: unknown }).send === 'function') {
				const sendFn = (channelForNotification as unknown as { send: (payload: unknown) => Promise<unknown> }).send;
				try {
					const payload = { content: notificationMessage };
					await sendFn(payload);
				} catch (sendErr) {
					console.warn('Failed to send economy notification:', sendErr);
				}
			}
		} catch (error) {
			console.error('Error updating user currency:', error);
		}
	}
});
