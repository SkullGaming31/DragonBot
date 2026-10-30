const { mongo: { MongoClient, MongoServerError } } = require('mongoose');

async function initializeReplicaSet() {
	const url = process.env.MONGO_URL;
	const host = process.env.MONGO_REPLICA_HOST;
	if (!url || !host) {
		throw new Error('MONGO_URL and MONGO_REPLICA_HOST are required');
	}

	const client = new MongoClient(url, { directConnection: true });
	try {
		await client.connect();
		const admin = client.db('admin');
		try {
			await admin.command({ replSetGetStatus: 1 });
		} catch (error) {
			if (!(error instanceof MongoServerError) || error.code !== 94) throw error;
			await admin.command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host }] } });
		}

		for (let attempt = 0; attempt < 60; attempt++) {
			const status = await admin.command({ replSetGetStatus: 1 });
			if (status.myState === 1) {
				console.log('MongoDB replica set is PRIMARY');
				return;
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		throw new Error('MongoDB replica set did not elect a primary within 60 seconds');
	} finally {
		await client.close();
	}
}

initializeReplicaSet().catch((error) => {
	console.error('Failed to initialize MongoDB replica set:', error);
	process.exitCode = 1;
});
