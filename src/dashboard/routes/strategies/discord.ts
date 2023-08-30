import { config } from 'dotenv';
import passport from 'passport';
import { Profile, Strategy } from 'passport-discord';
config();

import { TokenModel } from '../../../Database/Schemas/tokenModel';
import { ExtendedClient } from '../../../Structures/Client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function discordStrategy(client: ExtendedClient) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	passport.serializeUser((user: any, done) => {
		return done(null, user.id);
	});
	passport.deserializeUser(async (id, done) => {
		try {
			const user = await TokenModel.findOne({ _id: id });
			return user ? done(null, user) : done(null, null);
		} catch (error) {
			console.error(error);
			return done(error, null);
		}
	});
	passport.use(new Strategy({
		clientID: `${process.env.DISCORD_CLIENT_ID}`,
		clientSecret: `${process.env.DISCORD_CLIENT_SECRET}`,
		callbackURL: 'http://localhost:3001/api/auth/discord/redirect',
		scope: ['identify', 'email', 'guilds', 'connections']
	}, async (accessToken: string, refreshToken: string, profile: Profile, done) => {
		const { id: discordId, email } = profile;
		try {
			// Find the existing user by their Discord ID
			let existingUser = await TokenModel.findOne({ discordId });

			// If the user already exists, update their information
			if (existingUser) {
				existingUser.accessToken = accessToken;
				existingUser.refreshToken = refreshToken;
				existingUser.email = email;
				existingUser = await existingUser.save(); // Save the updated user
				return done(null, existingUser);
			}

			// If the user does not exist, create a new entry
			const newUser = new TokenModel({ discordId, accessToken, refreshToken, email });
			const savedUser = await newUser.save();
			return done(null, savedUser);
		} catch (error) {
			console.error(error);
			done(null, undefined);
		}
	})
	);
}