import mongoose from 'mongoose';
import Lobby from './models/Lobby.js';
import User from './models/User.js'; // Ensure User is registered
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function repro() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction';
    await mongoose.connect(mongoUri);
    
    // Simulate req.user
    const user = await User.findOne({});
    if (!user) {
      console.log('No user found to test with');
      process.exit(0);
    }

    console.log('Testing with user ID:', user._id);

    const lobbies = await Lobby.find({
      status: 'completed',
      $or: [
        { isPublic: true },
        { admin: user._id },
        { 'teams.user': user._id }
      ]
    })
      .populate('admin', 'username avatar')
      .populate('teams.user', 'username avatar')
      .sort({ updatedAt: -1 });

    console.log('Success! Found:', lobbies.length);
    process.exit(0);
  } catch (err) {
    console.error('REPRO FAILED:', err);
    process.exit(1);
  }
}

repro();
