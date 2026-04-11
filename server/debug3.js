import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://bhaveshsharma9257_db_user:g9SnLQ6F9hJVvxEg@cluster0.aoe33mx.mongodb.net/ipl-auction?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const lobbies = await db.collection('lobbies').find({ status: 'completed' }).toArray();
  console.log("Total completed lobbies:", lobbies.length);
  for (const l of lobbies) {
    console.log("Lobby Name:", l.name);
    console.log("Admin:", l.admin.toString());
    console.log("Teams users:", l.teams.map(t => t.user ? t.user.toString() : null));
  }
  process.exit(0);
}

run();
