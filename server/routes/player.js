import express from 'express';
import Player from '../models/Player.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/players — List all players with optional filters (public)
router.get('/', async (req, res) => {
  try {
    const { role, tier, overseas, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (tier) filter.tier = tier;
    if (overseas !== undefined) filter.isOverseas = overseas === 'true';
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const players = await Player.find(filter)
      .sort({ tier: 1, basePrice: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Player.countDocuments(filter);

    res.json({ players, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/players/:id — Get player details
router.get('/:id', auth, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
