let config;
try {
	config = rs.conf();
} catch (error) {
	if (error.code !== 94) throw error;
	rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongo:27017' }] });
	config = rs.conf();
}

if (config._id !== 'rs0' || config.members.length !== 1 || config.members[0].host !== 'mongo:27017') {
	throw new Error('Existing replica set does not match the expected rs0 configuration');
}

let ready = false;
for (let attempt = 0; attempt < 60; attempt++) {
	if (db.hello().isWritablePrimary) {
		ready = true;
		break;
	}
	sleep(1000);
}
if (!ready) throw new Error('MongoDB replica set did not elect a primary');
print('MongoDB replica set rs0 is ready');
