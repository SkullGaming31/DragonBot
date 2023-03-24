import routes from '../routes';
import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import url, { URLSearchParams } from 'url';
import { join } from 'path';
import passport from 'passport';
import session from 'express-session';
import ms from 'ms';

import { logger } from '../middleware/Logger';
import { discordStrategy } from '../../dashboard/routes/strategies/discord';
import { ExtendedClient } from '../../Structures/Client';

export function createApp(client: ExtendedClient) {
	discordStrategy(client);
	const app = express();
	const Port = 3001;

	app.use(cors({ origin: [`${process.env.DEV_DASHBOARD_DOMAIN}:3001`], credentials: true }));
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(express.static(join(__dirname, '../../../public')));
	app.use(session({
		secret: 'hueihnvuhes',
		saveUninitialized: false,
		resave: false,
		cookie: {
			maxAge: ms('15m')
		}
	}));
	app.use(passport.initialize());
	app.use(session());
	app.use('/', routes);
	app.use(logger);

	return app;
}