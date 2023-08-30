import store from 'connect-mongo';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import ms from 'ms';
import passport from 'passport';
import path from 'path';
import routes from '../routes';

import { ExtendedClient } from '../../Structures/Client';
import { discordStrategy } from '../../dashboard/routes/strategies/discord';
import { logger } from '../middleware/Logger';

export function createApp(client: ExtendedClient) {
	discordStrategy(client);
	const app = express();
	const Port = process.env.PORT;
	const sessionSecret = process.env.SESSION_SECRET as string;

	app.use(cors({ origin: [`${process.env.DEV_DASHBOARD_DOMAIN}:${Port}`], credentials: true }));
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.set('views', path.join(__dirname, '../views'));
	app.use(express.static(path.join(__dirname, '../public')));
	app.set('view engine', 'pug');
	app.use(session({
		secret: sessionSecret,
		saveUninitialized: false,
		resave: false,
		cookie: {
			maxAge: ms('15m')
		},
		store: store.create({ mongoUrl: process.env.MONGO_DATABASE_URI as string })
	}));
	app.use(passport.initialize());
	app.use('/api', routes);
	app.use(logger);

	return app;
}