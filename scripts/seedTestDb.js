const mongoose = require('mongoose');
// Load local .env when present so developers can run the seed script locally
try {
	require('dotenv').config();
} catch (e) {
	// dotenv is optional in CI
}

async function ensureReplicaSet(db, mongoHost = 'mongo:27017') {
	const admin = db.admin();

	// If replset already configured, return early when a primary is present
	try {
		const status = await admin.command({ replSetGetStatus: 1 });
		if (status && status.myState === 1) {
			console.log('Replica set already initialized, state=PRIMARY');
			return;
		}
		if (status && typeof status.myState === 'number') {
			console.log('Replica set initialized, state=', status.myState);
			return;
		}
	} catch (err) {
		console.log('Replica set not initialized yet:', err.message || err);
	}

	// Try initiate with explicit config to avoid ambiguous defaults in CI
	const cfg = { _id: 'rs0', members: [{ _id: 0, host: mongoHost }] };
	try {
		console.log('Attempting replSetInitiate with config', JSON.stringify(cfg));
		await admin.command({ replSetInitiate: cfg });
	} catch (err) {
		console.log('replSetInitiate error (may be already initiated):', err.message || err);
	}

	// Wait for primary election
	const maxChecks = 60;
	for (let i = 0; i < maxChecks; i++) {
		try {
			const s = await admin.command({ replSetGetStatus: 1 });
			if (s && s.myState === 1) {
				console.log('Replica set primary elected');
				return;
			}
			// Also consider any member reporting PRIMARY (helps when running outside the server)
			if (Array.isArray(s.members)) {
				const primary = s.members.find((m) => m.stateStr === 'PRIMARY');
				if (primary) {
					console.log('Found PRIMARY in members:', primary);
					return;
				}
			}
		} catch (err) {
			// ignore and retry
		}
		await new Promise((r) => setTimeout(r, 1000));
	}
	throw new Error('Replica set primary not elected in time');
}

async function seed() {
	// Prefer an explicit connection URL from env (.env or CI). Fall back to host candidates.
	const providedUrl = process.env.MONGO_URL || process.env.MONGO_DEV_URI || process.env.MONGODB_URI || process.env.MONGO_URI;

	// Use a replica-set-aware connection string; try several hostnames used in CI
	const defaultHost = process.env.MONGO_HOST || 'mongo:27017';
	const candidateHosts = [
		defaultHost,
		process.env.MONGO_HOST_ALT || 'localhost:27017',
		'127.0.0.1:27017',
	];

	// If user provided full MONGO_URL via env, `providedUrl` (declared above) will be used;
	// otherwise the script will probe the candidate hosts.
	let connected = false;
	let lastError = null;
	for (const host of candidateHosts) {
		const base = process.env.MONGO_URL_BASE || `mongodb://${host}/testdb`;
		const mongoUrl = providedUrl || `${base}?replicaSet=rs0`;
		console.log(`Seeding test DB at ${mongoUrl}`);

		// Retry connect loop with exponential backoff — CI mongo service may take time
		const maxAttempts = 6;
		let delayMs = 2000;
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				console.log(`Attempting mongoose.connect to ${host} (attempt ${attempt}/${maxAttempts})`);
				await mongoose.connect(mongoUrl, {
					serverSelectionTimeoutMS: 10000,
					connectTimeoutMS: 10000,
				});
				connected = true;
				break;
			} catch (err) {
				lastError = err;
				console.log(`Connection attempt ${attempt} to ${host} failed: ${err.message || err}`);
				if (attempt < maxAttempts) {
					console.log(`Waiting ${delayMs}ms before retrying...`);
					await new Promise((r) => setTimeout(r, delayMs));
					delayMs = Math.min(30000, Math.floor(delayMs * 1.8));
				}
			}
		}

		if (connected) {
			// Ensure replica set is initialized so transaction tests can run in CI
			try {
				await ensureReplicaSet(mongoose.connection.db, host);
			} catch (err) {
				console.error('Replica set setup failed:', err.message || err);
				// continue — some tests may still run without transactions
			}
			break;
		}
		console.log(`Could not connect using host ${host}, trying next candidate.`);
	}

	if (!connected) {
		console.error('All connection attempts failed');
		if (lastError) console.error(lastError.stack || lastError);
		throw new Error('Unable to connect to MongoDB after multiple attempts');
	}

	// Drop any existing test data
	await mongoose.connection.db.dropDatabase();

	// Insert a couple of basic users to exercise economy commands
	const users = [
		{
			guildID: 'guild-test',
			id: '1001',
			username: 'alice',
			balance: 100,
			bank: 0,
			inventory: [],
			AFKmessage: '',
			AFKstatus: null,
			houseCooldown: null,
			policeAlertLevel: 0,
			storeCooldown: null,
			lastRewardTime: 0,
		},
		{
			guildID: 'guild-test',
			id: '1002',
			username: 'bob',
			balance: 50,
			bank: 0,
			inventory: [],
			AFKmessage: '',
			AFKstatus: null,
			houseCooldown: null,
			policeAlertLevel: 0,
			storeCooldown: null,
			lastRewardTime: 0,
		},
	];

	await mongoose.connection.collection('Users').insertMany(users);

	console.log('Seed complete');
	await mongoose.disconnect();
}

seed().catch((err) => {
	console.error('Seeding failed', err);
	process.exit(1);
});
