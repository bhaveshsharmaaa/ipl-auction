import mongoose from 'mongoose';
import Lobby from './models/Lobby.js';
mongoose.connect('mongodb://localhost:27017/ipl-auction').then(async () => {
    try {
        const lobbyId = '69d825a648168f6ef7b20470';
        const lobby = await Lobby.findById(lobbyId);
        if(!lobby) return console.log('no lobby found for', lobbyId);
        
        console.log('Found lobby:', lobby.name);
        
        const emptySlots = lobby.maxTeams - lobby.teams.length;
        const TEAM_COLORS = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        ];

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
        await lobby.save();
        console.log('SUCCESS!');
    } catch(e) {
        console.error('ERROR SAVING:');
        console.error(e);
    }
    process.exit();
});
