import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Player from './models/Player.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ipl-auction');
    console.log('✅ Connected to MongoDB');

    // Clear existing players
    await Player.deleteMany({});
    console.log('🗑️  Cleared existing players');

    // Read and insert players
    const playersData = JSON.parse(
      readFileSync(join(__dirname, 'data', 'players.json'), 'utf8')
    );

    const players = await Player.insertMany(playersData);
    console.log(`🏏 Inserted ${players.length} players`);

    // Summary
    const summary = {
      total: players.length,
      marquee: players.filter(p => p.tier === 'Marquee').length,
      tierA: players.filter(p => p.tier === 'A').length,
      tierB: players.filter(p => p.tier === 'B').length,
      tierC: players.filter(p => p.tier === 'C').length,
      batsmen: players.filter(p => p.role === 'Batsman').length,
      bowlers: players.filter(p => p.role === 'Bowler').length,
      allRounders: players.filter(p => p.role === 'All-Rounder').length,
      wicketkeepers: players.filter(p => p.role === 'Wicketkeeper').length,
      overseas: players.filter(p => p.isOverseas).length,
      indian: players.filter(p => !p.isOverseas).length
    };

    console.log('\n📊 Seed Summary:');
    console.table(summary);

    await mongoose.disconnect();
    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
