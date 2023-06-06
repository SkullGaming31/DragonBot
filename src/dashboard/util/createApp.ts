import routes from '../routes';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import ms from 'ms';
import store from 'connect-mongo';
import path from 'path';

import { logger } from '../middleware/Logger';
import { discordStrategy } from '../../dashboard/routes/strategies/discord';
import { ExtendedClient } from '../../Structures/Client';

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
	app.set('view engine', 'ejs');
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
	app.use(session());
	app.use('/api', routes);
	app.use(logger);

	return app;
}