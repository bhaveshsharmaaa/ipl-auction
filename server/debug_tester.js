import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://bhaveshsharma9257_db_user:g9SnLQ6F9hJVvxEg@cluster0.aoe33mx.mongodb.net/ipl-auction?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  
  const user = await db.collection('users').findOne({ username: 'tester123' });
  if (!user) {
    console.log("User tester123 not found");
  } else {
    console.log("User tester123 ID:", user._id.toString());
    
    const count = await db.collection('lobbies').countDocuments({
      status: 'completed',
      $or: [
        { admin: user._id },
        { 'teams.user': user._id }
      ]
    });
    console.log("Query count for tester123:", count);
  }
  process.exit(0);
}

run();
