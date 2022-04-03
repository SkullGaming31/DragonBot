module.exports = {
  id: 'hello',
  permission: 'ADMINISTRATOR',
  execute (interaction) {
    interaction.reply({ content: 'Im working here' });
  }
}