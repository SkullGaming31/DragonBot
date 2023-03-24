import connectDatabase from '../Database';
import http from 'http';
import mongoose from 'mongoose';

const healthListener: http.RequestListener = async (_req, res) => {
	/**
   * @todo check MongoDB connection
   * @todo check Discord connection
   * @todo check other ...
   */
	const isOK = true;

	//#region Mongo
	mongoose.connection.on('disconnected', () => {
		console.log('MongoDB Disconnected');
		//reconnect to Database
		connectDatabase();
	});
	mongoose.connection.on('disconnecting', () => {
		console.log('Database Disconnecting');
		// Reconnect to the database
		connectDatabase();
	});
	//#endregion

	res.writeHead(isOK ? 200 : 500);
	res.end();
};

export default healthListener;
