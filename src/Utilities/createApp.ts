import express from 'express';

const createApp = () => {
	const app = express();

	// Middleware and routes go here
	app.use(express.json());

	return app;
};

export default createApp;
