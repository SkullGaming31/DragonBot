const mongoose = require('mongoose');

async function seed() {
  const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017/testdb';
  console.log(`Seeding test DB at ${mongoUrl}`);
  await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10000 });

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
