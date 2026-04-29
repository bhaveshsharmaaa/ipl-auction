import express from 'express';
import Lobby from '../models/Lobby.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { IPL_FRANCHISES } from '../utils/franchises.js';

const router = express.Router();

// POST /api/lobby — Create a new lobby
router.post('/', auth, async (req, res) => {
  try {
    const { name, isPublic, maxTeams, settings, auctionType } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Lobby name must be at least 2 characters' });
    }

    const firstFranchise = IPL_FRANCHISES[Math.floor(Math.random() * IPL_FRANCHISES.length)];
    const requestedMaxTeams = maxTeams ? parseInt(maxTeams) : 10;
    
    const validTypes = ['small', 'mini', 'mega'];
    const resolvedAuctionType = validTypes.includes(auctionType) ? auctionType : 'mini';

    const lobby = await Lobby.create({
      name: name.trim(),
      isPublic: isPublic !== false,
      maxTeams: Math.min(10, Math.max(2, requestedMaxTeams)),
      auctionType: resolvedAuctionType,
      admin: req.user._id,
      teams: [{
        user: req.user._id,
        teamName: firstFranchise.name,
        teamColor: firstFranchise.color,
        isReady: true,
        budget: settings?.budget || 12000,
        players: [],
        overseasCount: 0
      }],
      settings: {
        budget: settings?.budget || 12000,
        maxPlayers: settings?.maxPlayers || 25,
        minPlayers: settings?.minPlayers || 18,
        maxOverseas: settings?.maxOverseas || 8,
        bidTimer: settings?.bidTimer || 10,
        bidIncrement: settings?.bidIncrement || 20
      }
    });

    const populated = await Lobby.findById(lobby._id)
      .populate('admin', 'username avatar')
      .populate('teams.user', 'username avatar');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create lobby error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/lobby/admin/all — Admin: list ALL lobbies (any status)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const lobbies = await Lobby.find({})
      .populate('admin', 'username avatar')
      .populate('teams.user', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(lobbies);
  } catch (error) {
    console.error('Admin list all lobbies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/lobby — List public lobbies + User's active lobbies
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching lobbies for user:', req.user._id);

    // Super admin sees ALL non-completed lobbies
    const query = req.user.isAdmin
      ? { status: { $ne: 'completed' } }
      : {
          $or: [
            { 
              status: 'waiting', 
              isPublic: true,
              $expr: { $lt: [{ $size: "$teams" }, "$maxTeams"] }
            },
            { 
              status: 'in-progress', 
              isPublic: true,
              $or: [
                { teams: { $elemMatch: { user: null, isAI: false } } },
                { $expr: { $lt: [{ $size: "$teams" }, "$maxTeams"] } }
              ]
            },
            { admin: req.user._id, status: { $ne: 'completed' } },
            { 'teams.user': req.user._id, status: { $ne: 'completed' } }
          ]
        };

    const lobbies = await Lobby.find(query)
      .populate('admin', 'username avatar')
      .populate('teams.user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(lobbies);
  } catch (error) {
    console.error('List lobbies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

import { evaluateTeams } from '../services/evaluator.js';
import AuctionState from '../models/AuctionState.js';

// GET /api/lobby/completed — List completed lobbies for the user
router.get('/completed', auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.json([]);

    console.log('Fetching completed lobbies for user:', userId);
    
    let query = { status: 'completed' };
    
    if (!req.user.isAdmin) {
      query.$or = [
        { admin: userId },
        { 'teams.user': userId }
      ];
    }

    const lobbies = await Lobby.find(query)
      .populate('admin', 'username avatar')
      .populate('teams.user', 'username avatar')
      .populate('teams.players')
      .sort({ updatedAt: -1 });

    const results = await Promise.all(lobbies.map(async (lobby) => {
      try {
        const auction = await AuctionState.findOne({ lobby: lobby._id }).populate('soldPlayers.player');
        if (auction) {
          const evaluation = evaluateTeams(lobby, auction);
          return { ...lobby.toObject(), bestTeam: evaluation.bestTeam };
        }
      } catch (e) {
        console.error('Error evaluating team for lobby', lobby._id, e);
      }
      return lobby.toObject();
    }));

    console.log(`Matched ${results.length} lobbies for ${userId}:`, results.map(l => l.name));
    res.json(results);
  } catch (error) {
    console.error('List completed lobbies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/lobby/:id — Get lobby details
router.get('/:id', auth, async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id)
      .populate('admin', 'username avatar')
      .populate('teams.user', 'username avatar')
      .populate('teams.players');

    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    res.json(lobby);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/lobby/join — Join lobby by code
router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Lobby code is required' });
    }

    const lobby = await Lobby.findOne({ code: code.toUpperCase() });

    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    if (lobby.status === 'in-progress') {
      // Check if there are any vacant slots to takeover OR if there is room for new teams
      const hasVacant = lobby.teams.some(t => !t.user && !t.isAI);
      const isUnderMax = lobby.teams.length < lobby.maxTeams;
      if (!hasVacant && !isUnderMax) {
        return res.status(400).json({ message: 'Auction is in progress and all slots are occupied' });
      }
      // If we got here, they can "Enter" the lobby but they haven't picked a team yet.
      // We don't push a new team, we just return the lobby so they land in selection.
      return res.json(lobby);
    } else if (lobby.status !== 'waiting') {
      return res.status(400).json({ message: 'Auction already completed' });
    }

    if (lobby.teams.length >= lobby.maxTeams) {
      return res.status(400).json({ message: 'Lobby is full' });
    }

    const alreadyJoined = lobby.teams.some(t => t.user && t.user.toString() === req.user._id.toString());
    if (alreadyJoined) {
      return res.status(400).json({ message: 'Already in this lobby' });
    }

    const usedNames = lobby.teams.map(t => t.teamName);
    const availableFranchise = IPL_FRANCHISES.find(f => !usedNames.includes(f.name)) || IPL_FRANCHISES[0];

    lobby.teams.push({
      user: req.user._id,
      teamName: availableFranchise.name,
      teamColor: availableFranchise.color,
      isReady: true,
      budget: lobby.settings.budget,
      players: [],
      overseasCount: 0
    });

    await lobby.save();

    const populated = await Lobby.findById(lobby._id)
      .populate('admin', 'username avatar')
      .populate('teams.user', 'username avatar');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/lobby/:id/leave — Leave a lobby
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    const io = req.app.get('io');

    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    const isAdmin = lobby.admin.toString() === req.user?._id.toString();

    if (isAdmin) {
      // Find other real users (non-AI and not the leaving admin)
      const otherRealUsers = lobby.teams.filter(t => 
        !t.isAI && t.user && t.user.toString() !== req.user?._id.toString()
      );
      
      console.log(`Admin leaving. Other real users found: ${otherRealUsers.length}`);

      if (otherRealUsers.length === 0) {
        // Delete if no other real users exist
        await Lobby.findByIdAndDelete(lobby._id);
        if (io) io.to(`lobby:${lobby._id}`).emit('lobby:deleted');
        return res.json({ message: 'Lobby deleted (last real user left)' });
      } else {
        // Transfer admin tag to the next real user
        const newAdminId = otherRealUsers[0].user;
        lobby.admin = newAdminId;
        console.log(`Transferring admin from ${req.user._id} to ${newAdminId}`);
      }
    }

    // If auction is in progress, replace with AI instead of removing
    if (lobby.status === 'in-progress' || lobby.status === 'completed') {
      const userTeamIndex = lobby.teams.findIndex(t => 
        t.user && t.user.toString() === req.user?._id.toString()
      );
      
      if (userTeamIndex !== -1) {
        // Mark as vacant for admin decision (Keep isAI = false for now)
        lobby.teams[userTeamIndex].isAI = false;
        lobby.teams[userTeamIndex].user = null;
        lobby.markModified('teams'); 
        console.log(`User ${req.user._id} left during ${lobby.status}. Team ${lobby.teams[userTeamIndex].teamName} is now VACANT.`);
      }
    } else {
      // During waiting, remove the leaving user from the teams array
      lobby.teams = lobby.teams.filter(t => 
        !t.user || t.user.toString() !== req.user?._id.toString()
      );
    }
    
    await lobby.save();

    // Notify others via socket if lobby persists
    if (io) {
      const populatedLobby = await Lobby.findById(lobby._id)
        .populate('admin', 'username avatar')
        .populate('teams.user', 'username avatar');
      io.to(`lobby:${lobby._id}`).emit('lobby:updated', populatedLobby);
    }

    res.json({ 
      message: isAdmin ? 'Left lobby successfully (admin transferred)' : 'Left lobby successfully' 
    });
  } catch (error) {
    console.error('Leave lobby error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/lobby/:id — Lobby admin OR super-admin: Forcibly destroy a lobby
router.delete('/:id', auth, async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    const io = req.app.get('io');

    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    const isLobbyAdmin = lobby.admin.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.isAdmin === true;

    if (!isLobbyAdmin && !isSuperAdmin) {
      return res.status(403).json({ message: 'Only the lobby admin or super-admin can delete this lobby' });
    }

    await Lobby.findByIdAndDelete(lobby._id);
    
    if (io) {
      io.to(`lobby:${lobby._id}`).emit('lobby:deleted', { 
        message: isSuperAdmin && !isLobbyAdmin 
          ? '🚨 Super Admin has deleted the lobby' 
          : '🚨 Admin has deleted the lobby' 
      });
    }

    console.log(`Lobby ${lobby.name} (${lobby._id}) deleted by ${isSuperAdmin ? 'SUPER-ADMIN' : 'lobby admin'}: ${req.user.username}`);
    res.json({ message: 'Lobby destroyed successfully' });
  } catch (error) {
    console.error('Delete lobby error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/lobby/:id/settings — Update lobby settings (admin only)
router.patch('/:id/settings', auth, async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);

    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    if (lobby.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can update settings' });
    }

    if (lobby.status !== 'waiting') {
      return res.status(400).json({ message: 'Cannot update settings during auction' });
    }

    const { settings, name, isPublic } = req.body;

    if (name) lobby.name = name;
    if (isPublic !== undefined) lobby.isPublic = isPublic;
    if (settings) {
      Object.assign(lobby.settings, settings);
      // Update all team budgets to match new setting
      lobby.teams.forEach(team => {
        team.budget = lobby.settings.budget;
      });
    }

    await lobby.save();

    const populated = await Lobby.findById(lobby._id)
      .populate('admin', 'username avatar')
      .populate('teams.user', 'username avatar');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
