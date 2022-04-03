const { Client } = require('discord.js');
const DB = require('../Schemas/FilterDB');
/**
 * 
 * @param {Client} client 
 */
module.exports = (client) => {
  DB.find().then((documents) => {
    documents.forEach((doc) => {
      client.filters.set(doc.Guild, doc.Words);
      client.filtersLog.set(doc.Guild, doc.Log);
    });
  });
};