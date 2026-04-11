import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://bhaveshsharma9257_db_user:g9SnLQ6F9hJVvxEg@cluster0.aoe33mx.mongodb.net/ipl-auction?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  
  const user = await db.collection('users').findOne({ username: 'tester123' });
  const userId = user._id;
  
  const results = await db.collection('lobbies').find({
    status: 'completed',
    $or: [
      { admin: userId },
      { 'teams.user': userId }
    ]
  }).toArray();
  
  console.log("Total matched for tester123:", results.length);
  process.exit(0);
}

run();
