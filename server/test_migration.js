import mongoose from 'mongoose';
import Lobby from './models/Lobby.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testAdminLeave() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction';
    await mongoose.connect(mongoUri);
    
    // 1. Find a lobby with at least 2 real teams
    const lobby = await Lobby.findOne({ 
        $where: "this.teams.filter(t => !t.isAI).length >= 2" 
    });

    if (!lobby) {
      console.log('No suitable lobby found for testing (need at least 2 real participants)');
      // Let's create one for testing
      const users = await User.find({}).limit(2);
      if (users.length < 2) {
          console.log('Not enough users in DB to create test lobby');
          process.exit(0);
      }
      
      const newLobby = new Lobby({
          name: 'Test Migration',
          admin: users[0]._id,
          teams: [
              { user: users[0]._id, teamName: 'CSK', isAI: false },
              { user: users[1]._id, teamName: 'MI', isAI: false }
          ],
          code: 'TEST12',
          settings: { budget: 10000 }
      });
      await newLobby.save();
      console.log('Created test lobby:', newLobby._id);
      return runLogic(newLobby, users[0]);
    }

    console.log('Found lobby:', lobby._id, 'Admin:', lobby.admin);
    const adminUser = await User.findById(lobby.admin);
    await runLogic(lobby, adminUser);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function runLogic(lobby, reqUser) {
    const isAdmin = lobby.admin.toString() === reqUser._id.toString();
    console.log('Is Requester Admin?', isAdmin);

    if (isAdmin) {
      const otherRealUsers = lobby.teams.filter(t => 
        !t.isAI && t.user && t.user.toString() !== reqUser._id.toString()
      );
      
      console.log('Other real users:', otherRealUsers.length);

      if (otherRealUsers.length === 0) {
        console.log('WOULD DELETE');
      } else {
        const newAdminId = otherRealUsers[0].user;
        lobby.admin = newAdminId;
        console.log('NEW ADMIN SHOULD BE:', newAdminId);
      }
    }

    lobby.teams = lobby.teams.filter(t => 
      !t.user || t.user.toString() !== reqUser._id.toString()
    );
    
    await lobby.save();
    console.log('SAVE SUCCESSFUL. Final Admin:', lobby.admin);
    console.log('Final Teams Count:', lobby.teams.length);
    process.exit(0);
}

testAdminLeave();
