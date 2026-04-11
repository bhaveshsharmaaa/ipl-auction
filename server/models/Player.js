import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nationality: { type: String, required: true },
  isOverseas: { type: Boolean, default: false },
  role: {
    type: String,
    required: true,
    enum: ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper']
  },
  specialization: { type: String, default: '' },
  basePrice: { type: Number, required: true }, // in lakhs
  stats: {
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    battingAvg: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    bowlingAvg: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
    catches: { type: Number, default: 0 },
    fifties: { type: Number, default: 0 },
    hundreds: { type: Number, default: 0 }
  },
  tier: {
    type: String,
    enum: ['Legend', 'Marquee', 'A', 'B', 'C'],
    default: 'C'
  },
  image: { type: String, default: '' }
}, { timestamps: true });

playerSchema.index({ role: 1, tier: 1 });
playerSchema.index({ nationality: 1 });

export default mongoose.model('Player', playerSchema);
