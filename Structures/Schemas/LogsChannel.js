const { model, Schema } = require('mongoose');

module.exports = model('loggerchannel', new Schema({
	Guild: String,
	Channel: String
}));