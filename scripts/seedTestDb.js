const mongoose = require('mongoose');

async function ensureReplicaSet(db) {
  const admin = db.admin();
  try {
    const status = await admin.command({ replSetGetStatus: 1 });
    if (status && typeof status.myState === 'number') {
      console.log('Replica set already initialized, state=', status.myState);
      return;
    }
  } catch (err) {
    console.log('Replica set not initialized yet:', err.message || err);
  }

  try {
    console.log('Attempting replSetInitiate...');
    await admin.command({ replSetInitiate: {} });
  } catch (err) {
    console.log('replSetInitiate error (may be already initiated):', err.message || err);
  }

  // Wait for primary
  for (let i = 0; i < 30; i++) {
    try {
      const s = await admin.command({ replSetGetStatus: 1 });
      if (s && s.myState === 1) {
        console.log('Replica set primary elected');
        return;
      }
    } catch (err) {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Replica set primary not elected in time');
}

async function seed() {
  const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017/testdb';
  console.log(`Seeding test DB at ${mongoUrl}`);
  await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10000 });

  // Ensure replica set is initialized so transaction tests can run in CI
  try {
    await ensureReplicaSet(mongoose.connection.db);
  } catch (err) {
    console.error('Replica set setup failed:', err.message || err);
    // continue — some tests may still run without transactions
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
