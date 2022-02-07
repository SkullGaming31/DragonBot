const mongoose = require('mongoose');
const config = require('../config');

const Username = config.MONGODB_USERNAME;
const Password = config.MONGODB_PASSWORD;
const Database = config.MONGODB_DATABASE;

mongoose.connect(`mongodb+srv://${Username}:${Password}@overlayexpert.mznzy.mongodb.net/${Database}?retryWrites=true&w=majority`);

const { connection: db } = mongoose;

db.on('connected', () => { console.log('Discord Database Connected'); });

db.on('disconnected', () => { console.log('Discord Database Disconnected'); });

db.on('error', err => { console.error(err); });

module.exports = db;