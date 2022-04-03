const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
  name: 'testbutton',
  description: 'a testing button',
  async execute(interaction) {
    const row = new MessageActionRow();
    row.addComponents(
      new MessageButton()
      .setCustomId('hello').setLabel('Hello').setStyle('DANGER'),
      new MessageButton()
      .setCustomId('Bye').setLabel('Good Bye').setStyle('SECONDARY')
    )
    interaction.reply({ components: [row] });
  }
}