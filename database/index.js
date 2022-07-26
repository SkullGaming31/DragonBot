const mongoose = require('mongoose');
const { MONGO_DATABASE, MONGO_PASSWORD, MONGO_USERNAME, MONGO_DATABASE_URI } = require('../Structures/config');

async function mongoConnect() {
	if (!MONGO_DATABASE_URI) return;
	await mongoose.connect(MONGO_DATABASE_URI, {
		user: MONGO_USERNAME,
		pass: MONGO_PASSWORD,
		dbName: MONGO_DATABASE,
		connectTimeoutMS: 10000,
		useNewUrlParser: true,
		useUnifiedTopology: true
	}).then(() => {
		console.log('Database Connected');
	}).catch((err) => {
		console.log(err);
	});
}

module.exports = {
	mongoConnect
};