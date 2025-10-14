import { Message } from 'discord.js';
import { Event } from '../../Structures/Event';

export default new Event('messageCreate', async (message: Message) => {
  const { author, content } = message;
  if (content.includes('starboard') && !author.bot) {
    await message.reply({ content: 'Starboard is a feature that allows users to highlight important messages by reacting with a star emoji. These messages are then collected and displayed in a dedicated channel.' });
  }
});