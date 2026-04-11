import mongoose from 'mongoose';

const auctionStateSchema = new mongoose.Schema({
  lobby: { type: mongoose.Schema.Types.ObjectId, ref: 'Lobby', required: true, unique: true },
  playerPool: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  currentPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  currentBid: { type: Number, default: 0 },
  currentBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bidHistory: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    teamName: String,
    isAI: { type: Boolean, default: false },
    amount: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  soldPlayers: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    buyerTeamName: String,
    price: Number
  }],
  unsoldPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  currentPlayerIndex: { type: Number, default: 0 },
  round: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['active', 'paused', 'player-bidding', 'player-sold', 'player-unsold', 'completed'],
    default: 'active'
  },
  timerEnd: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('AuctionState', auctionStateSchema);
