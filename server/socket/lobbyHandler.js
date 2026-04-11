import Lobby from '../models/Lobby.js';
import { IPL_FRANCHISES, getFranchiseColor } from '../utils/franchises.js';

export function setupLobbyHandlers(io, socket) {
  // Join a lobby room
  socket.on('lobby:join', async ({ lobbyId }) => {
    try {
      socket.join(`lobby:${lobbyId}`);
      const lobby = await Lobby.findById(lobbyId)
        .populate('admin', 'username avatar')
        .populate('teams.user', 'username avatar');

      if (lobby) {
        io.to(`lobby:${lobbyId}`).emit('lobby:updated', lobby);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to join lobby room' });
    }
  });

  // Leave a lobby room
  socket.on('lobby:leave', async ({ lobbyId }) => {
    socket.leave(`lobby:${lobbyId}`);
  });



  // Update team name/color
  socket.on('lobby:teamUpdate', async ({ lobbyId, teamName, teamColor }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby) return;

      const team = lobby.teams.find(t => !t.isAI && t.user && t.user.toString() === socket.user._id.toString());
      if (team) {
        // Validate teamName if provided
        if (teamName) {
          const franchise = IPL_FRANCHISES.find(f => f.name === teamName);
          if (!franchise) {
            return socket.emit('error', { message: 'Invalid IPL franchise name' });
          }
          
          // Check if taken by another user/AI
          const taken = lobby.teams.some(t => t.teamName === teamName && t._id.toString() !== team._id.toString());
          if (taken) {
            return socket.emit('error', { message: `Team ${teamName} is already taken` });
          }

          team.teamName = teamName;
          team.teamColor = franchise.color;
        }
        
        await lobby.save();

        const populated = await Lobby.findById(lobbyId)
          .populate('admin', 'username avatar')
          .populate('teams.user', 'username avatar');

        io.to(`lobby:${lobbyId}`).emit('lobby:updated', populated);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to update team' });
    }
  });

  // Claim a vacant team (Mid-Auction takeover)
  socket.on('lobby:claimTeam', async ({ lobbyId, teamId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby) return socket.emit('error', { message: 'Lobby not found' });

      // Check if user already has a team in this lobby (Locking rule)
      const existingTeam = lobby.teams.find(t => t.user && t.user.toString() === socket.user._id.toString());
      if (existingTeam) {
        return socket.emit('error', { message: 'You already have a team and cannot switch during an auction' });
      }

      const team = lobby.teams.id(teamId);
      if (!team) return socket.emit('error', { message: 'Team slot not found' });

      // Check if team is truly vacant (Occupancy protection)
      if (team.user || team.isAI) {
        return socket.emit('error', { message: 'This team is already occupied by another user or AI' });
      }

      // Claim it
      team.user = socket.user._id;
      await lobby.save();

      const populated = await Lobby.findById(lobbyId)
        .populate('admin', 'username avatar')
        .populate('teams.user', 'username avatar');

      io.to(`lobby:${lobbyId}`).emit('lobby:updated', populated);
      socket.emit('lobby:claimed', { teamId });
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Failed to claim team' });
    }
  });

  // Join as a new team mid-auction
  socket.on('lobby:joinMidAuctionAsNew', async ({ lobbyId, teamName }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby) return socket.emit('error', { message: 'Lobby not found' });

      if (lobby.teams.length >= lobby.maxTeams) {
        return socket.emit('error', { message: 'Lobby is full' });
      }

      const existingTeam = lobby.teams.find(t => t.user && t.user.toString() === socket.user._id.toString());
      if (existingTeam) {
        return socket.emit('error', { message: 'You already have a team' });
      }

      const franchise = IPL_FRANCHISES.find(f => f.name === teamName);
      if (!franchise) return socket.emit('error', { message: 'Invalid franchise' });

      const taken = lobby.teams.some(t => t.teamName === teamName);
      if (taken) return socket.emit('error', { message: 'Franchise already taken' });

      lobby.teams.push({
        user: socket.user._id,
        teamName: franchise.name,
        teamColor: franchise.color,
        isReady: true,
        budget: lobby.settings?.budget || 12000,
        players: [],
        overseasCount: 0
      });

      await lobby.save();

      const populated = await Lobby.findById(lobbyId)
        .populate('admin', 'username avatar')
        .populate('teams.user', 'username avatar');

      io.to(`lobby:${lobbyId}`).emit('lobby:updated', populated);
      
      // We don't need to emit lobby:claimed because the frontend navigate logic already uses 'myTeam' check.
      // But let's emit it anyway just in case the frontend relies on it for state.
      const newTeam = populated.teams[populated.teams.length - 1];
      socket.emit('lobby:claimed', { teamId: newTeam._id });
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Failed to join auction' });
    }
  });

  // Toggle between AI and Vacancy (Admin Only)
  socket.on('lobby:toggleAIVacancy', async ({ lobbyId, teamId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby) return;

      if (lobby.admin.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { message: 'Only the admin can perform this action' });
      }

      const team = lobby.teams.id(teamId);
      if (!team) return;

      if (team.user) {
        return socket.emit('error', { message: 'Cannot toggle an occupied team' });
      }

      // Toggle logic
      team.isAI = !team.isAI;
      team.user = null; // Ensure user is null in both cases
      await lobby.save();

      const populated = await Lobby.findById(lobbyId)
        .populate('admin', 'username avatar')
        .populate('teams.user', 'username avatar');

      io.to(`lobby:${lobbyId}`).emit('lobby:updated', populated);
    } catch (error) {
      socket.emit('error', { message: 'Failed to toggle AI/Vacancy' });
    }
  });

  // Fill empty slots with AI bots (Admin only)
  socket.on('lobby:fillAI', async ({ lobbyId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby) return;

      // Only admin can fill with AI
      if (lobby.admin.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { message: 'Only admin can fill AI bots' });
      }

      if (lobby.status !== 'waiting') {
        return socket.emit('error', { message: 'Auction already started' });
      }

      const emptySlots = lobby.maxTeams - lobby.teams.length;
      if (emptySlots <= 0) {
        return socket.emit('error', { message: 'Lobby is already full' });
      }

      // Get names already in use
      const usedNames = lobby.teams.map(t => t.teamName);
      const availableIPLTeams = IPL_FRANCHISES.filter(t => !usedNames.includes(t.name));

      for (let i = 0; i < emptySlots; i++) {
        if (availableIPLTeams.length === 0) break;
        const iplTeam = availableIPLTeams.shift();
        lobby.teams.push({
          isAI: true,
          teamName: iplTeam.name,
          teamColor: iplTeam.color,
          isReady: true,
          budget: lobby.settings?.budget || 12000
        });
      }

      await lobby.save();

      const populated = await Lobby.findById(lobbyId)
        .populate('admin', 'username avatar')
        .populate('teams.user', 'username avatar');

      io.to(`lobby:${lobbyId}`).emit('lobby:updated', populated);
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Failed to fill AI bots' });
    }
  });

  // Remove AI bots (Admin only)
  socket.on('lobby:removeAI', async ({ lobbyId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby || lobby.status !== 'waiting') return;

      if (lobby.admin.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { message: 'Only admin can remove AI bots' });
      }

      // Remove all AI teams
      lobby.teams = lobby.teams.filter(t => !t.isAI);
      await lobby.save();

      const populated = await Lobby.findById(lobbyId)
        .populate('admin', 'username avatar')
        .populate('teams.user', 'username avatar');

      io.to(`lobby:${lobbyId}`).emit('lobby:updated', populated);
    } catch (error) {
      socket.emit('error', { message: 'Failed to remove AI bots' });
    }
  });

  // Delete Lobby (Admin only)
  socket.on('lobby:delete', async ({ lobbyId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby) return;

      if (lobby.admin.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { message: 'Only admin can delete this lobby' });
      }

      await Lobby.findByIdAndDelete(lobbyId);
      io.to(`lobby:${lobbyId}`).emit('lobby:deleted');
    } catch (error) {
      socket.emit('error', { message: 'Failed to delete lobby' });
    }
  });

}
