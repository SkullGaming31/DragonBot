const { model, Schema } = require('mongoose');

export default model('settings', new Schema({
	GuildID: String,
	LoggingChannel: String,
	AdministratorRole: String,
	ModeratorRole: String,
	Welcome: Boolean,
	WelcomeChannel: String,
	PromotionChannel: String
}));