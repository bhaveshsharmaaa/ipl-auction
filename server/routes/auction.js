import express from 'express';
import AuctionState from '../models/AuctionState.js';
import Lobby from '../models/Lobby.js';
import auth from '../middleware/auth.js';
import { evaluateTeams } from '../services/evaluator.js';

const router = express.Router();

// GET /api/auction/:lobbyId — Get current auction state
router.get('/:lobbyId', auth, async (req, res) => {
  try {
    const auction = await AuctionState.findOne({ lobby: req.params.lobbyId })
      .populate('currentPlayer')
      .populate('playerPool')
      .populate('soldPlayers.player')
      .populate('unsoldPlayers');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json(auction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auction/:lobbyId/results — Get final results with evaluation
router.get('/:lobbyId/results', auth, async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.lobbyId)
      .populate('teams.user', 'username avatar')
      .populate('teams.players');

    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    const auction = await AuctionState.findOne({ lobby: req.params.lobbyId })
      .populate('soldPlayers.player');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const evaluation = evaluateTeams(lobby, auction);

    res.json({
      lobby,
      auction: {
        soldPlayers: auction.soldPlayers,
        unsoldPlayers: auction.unsoldPlayers,
        status: auction.status
      },
      evaluation
    });
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
