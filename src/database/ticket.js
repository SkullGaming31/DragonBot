const { model, Schema } = require('mongoose');

const ticketSchema = new Schema({
	GuildId: {
		type: String,
	},
	MemberId: {
		type: String,
	},
	TicketId: {
		type: String,
	},
	ChannelId: {
		type: String,
	},
	Closed: {
		type: Boolean,
	},
	Locked: {
		type: Boolean,
	},
});

/**
 * @typedef ticketModel
 * @prop {string} GuildId
 * @prop {string} MemberId
 * @prop {string} TicketId
 * @prop {string} ChannelId
 * @prop {boolean} Closed
 * @prop {boolean} Locked
 */

/** @type {ticketModel | import('mongoose').Document} */

const ticketModel = model('ticket', ticketSchema);// tickets
module.exports = ticketModel;