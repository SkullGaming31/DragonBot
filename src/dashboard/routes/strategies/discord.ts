import passport from 'passport';
import { Profile, Strategy } from 'passport-discord';
import { config } from 'dotenv';
config();

import { ExtendedClient } from '../../../Structures/Client';
import { TokenModel } from '../../../Structures/Schemas/tokenModel';

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
		clientID: `${process.env.DEV_DISCORD_CLIENT_ID}`,
		clientSecret: `${process.env.DEV_DISCORD_CLIENT_SECRET}`,
		callbackURL: 'http://localhost:3001/auth/discord/redirect',
		scope: ['identify', 'email', 'guilds']
	}, async (accessToken: string, refreshToken: string, profile: Profile, done) => {
		const { id: discordId, email } = profile;
		try {
			const existingUser = await TokenModel.findOneAndUpdate({ id: discordId }, { accessToken, refreshToken }, { new: true });
			if (existingUser) return done(null, existingUser);
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