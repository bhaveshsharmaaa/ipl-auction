import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAI: { type: Boolean, default: false },
  teamName: { type: String, default: 'My Team' },
  teamColor: { type: String, default: '#4ECDC4' },
  isReady: { type: Boolean, default: false },
  budget: { type: Number, default: 12000 }, // in lakhs (12000 = 120 crore)
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  overseasCount: { type: Number, default: 0 }
}, { _id: true });

const lobbySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: {
    type: String,
    unique: true,
    uppercase: true,
    default: function() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      return code;
    }
  },
  isPublic: { type: Boolean, default: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teams: [teamSchema],
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'expired'],
    default: 'waiting'
  },
  maxTeams: { type: Number, default: 10 },
  auctionType: {
    type: String,
    enum: ['small', 'mini', 'mega'],
    default: 'mini'
  },
  expiresAt: { type: Date, index: true },
  settings: {
    budget: { type: Number, default: 12000 },
    maxPlayers: { type: Number, default: 25 },
    minPlayers: { type: Number, default: 18 },
    maxOverseas: { type: Number, default: 8 },
    bidTimer: { type: Number, default: 10 },
    bidIncrement: { type: Number, default: 20 }
  },
  messages: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Auto-compute expiresAt (24 hours from creation) for new lobbies
lobbySchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

lobbySchema.index({ status: 1, isPublic: 1 });
lobbySchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model('Lobby', lobbySchema);
