import mongoose from 'mongoose';
import Lobby from './models/Lobby.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

mongoose.connect('mongodb://localhost:27017/ipl-auction').then(async () => {
    try {
        const user = await User.findOne({ username: 'TestAdmin' });
        const lobbyId = '69d825a648168f6ef7b20470';
        const lobby = await Lobby.findById(lobbyId);
        console.log('1. Fetched lobby');
        
        if (lobby.admin.toString() !== user._id.toString()) {
            throw new Error('admin mismatch');
        }
        console.log('2. Admin matched');

        // simulate a small empty slot count
        const emptySlots = 1;
        const TEAM_COLORS = ['#FF6B6B'];

        for (let i = 0; i < emptySlots; i++) {
            const botIndex = lobby.teams.length + 1;
            lobby.teams.push({
                isAI: true,
                teamName: `AI Bot ${botIndex}`,
                teamColor: TEAM_COLORS[botIndex % TEAM_COLORS.length],
                isReady: true,
                budget: lobby.settings.budget
            });
        }
        console.log('3. Pushed teams');

        await lobby.save();
        console.log('4. Saved lobby');

        const populated = await Lobby.findById(lobbyId)
            .populate('admin', 'username avatar')
            .populate('teams.user', 'username avatar');
        
        console.log('5. Populated lobby successfully');
        console.log(populated.teams.map(t => t.teamName));
    } catch(e) {
        console.log('ERROR CAUGHT DURING MOCK:', e);
    }
    process.exit();
});
