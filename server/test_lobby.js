import mongoose from 'mongoose';
import Lobby from './models/Lobby.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function test() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    
    const countAll = await Lobby.countDocuments({});
    console.log('Total lobbies:', countAll);
    
    const countCompleted = await Lobby.countDocuments({ status: 'completed' });
    console.log('Completed lobbies:', countCompleted);

    const query = {
      status: 'completed',
      $or: [
        { isPublic: true },
        { admin: new mongoose.Types.ObjectId() }, // dummy
        { 'teams.user': new mongoose.Types.ObjectId() } // dummy
      ]
    };
    
    const results = await Lobby.find(query);
    console.log('Query results count:', results.length);
    if (results.length > 0) {
      console.log('First result:', results[0].name);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
