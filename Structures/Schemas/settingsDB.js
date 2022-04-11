const { model, Schema } = require('mongoose');

module.exports = model('settings', new Schema({
	GuildID: String,
	LoggingChannel: String,
	PromotionChannel: String,
	SupportChannel: String,
	AdministratorRole: String,
	ModeratorRole: String
}));