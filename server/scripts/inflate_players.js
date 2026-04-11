import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const playersPath = path.join(__dirname, '..', 'data', 'players.json');
const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf8'));

const TARGET_COUNT = 500;
const currentCount = playersData.length;
const neededCount = TARGET_COUNT - currentCount;

if (neededCount <= 0) {
    console.log(`Pool already has ${currentCount} players. No inflation needed.`);
    process.exit(0);
}

const indianFirstNames = ['Arjun', 'Rohan', 'Ishaan', 'Aditya', 'Vikram', 'Sanjay', 'Rahul', 'Ankit', 'Suresh', 'Manish', 'Deepak', 'Vijay', 'Karthik', 'Sameer', 'Piyush', 'Abhishek', 'Mayank', 'Prithvi', 'Nitish', 'Harshal', 'Avesh', 'Ravi', 'Kuldeep', 'Yuzvendra', 'Jasprit', 'Bhuvneshwar', 'Hardik', 'Krunal', 'Shreyas', 'Prithvi', 'Ruturaj', 'Devdutt', 'Suryakumar', 'Rishabh', 'Sanju', 'Ishan', 'Venkatesh', 'Deepak', 'Shardul', 'Mohammed', 'Umesh', 'T Natarajan', 'Chetan', 'Jaydev', 'Varun', 'Rahul', 'Axar', 'Washington', 'Shahbaz', 'Krishnappa'];
const indianLastNames = ['Sharma', 'Verma', 'Singh', 'Gupta', 'Patel', 'Iyer', 'Yadav', 'Reddy', 'Choudhary', 'Thakur', 'Khan', 'Pandey', 'Mishra', 'Jaiswal', 'Gaikwad', 'Rahul', 'Pant', 'Kishan', 'Samson', 'Hooda', 'Dube', 'Sundar', 'Chakravarthy', 'Bumrah', 'Shami', 'Siraj', 'Krishna', 'Saini', 'Sakariya', 'Unadkat', 'Tyagi', 'Porel', 'Nagarkoti', 'Mavi', 'Bishnoi', 'Markande', 'Tewatia', 'Gowtham', 'Parag', 'Shah', 'Nadeem', 'Gopal', 'Karthik', 'Rana', 'Tripathi', 'Padikkal', 'Dhawan', 'Gill', 'Pujara', 'Rahane'];

const overseasFirstNames = ['David', 'Steve', 'Chris', 'Ben', 'Joe', 'Pat', 'Mitchell', 'Glenn', 'Quinton', 'Kagiso', 'Anrich', 'Jos', 'Liam', 'Jofra', 'Sam', 'Rashid', 'Kane', 'Trent', 'Tim', 'Nicholas', 'Andre', 'Sunil', 'Kieron', 'Jason', 'Shimron', 'David', 'Marcus', 'Adam', 'Aaron', 'Wanindu', 'Dushmantha', 'Maheesh', 'Matheesha', 'Noor', 'Mujeeb', 'Naveen', 'Fazalhaq', 'Mustafizur', 'Shakib', 'Litton', 'Taskin', 'Marco', 'Dewald', 'Tristan', 'Heinrich', 'Rilee', 'Tabraiz', 'Lungi', 'Daryl', 'Finn', 'Devon', 'Michael', 'Glenn', 'Jimmy'];
const overseasLastNames = ['Warner', 'Smith', 'Gayle', 'Stokes', 'Root', 'Cummins', 'Starc', 'Maxwell', 'de Kock', 'Rabada', 'Nortje', 'Buttler', 'Livingstone', 'Archer', 'Curran', 'Khan', 'Williamson', 'Boult', 'Southee', 'Pooran', 'Russell', 'Narine', 'Pollard', 'Holder', 'Hetmyer', 'Miller', 'Stoinis', 'Zampa', 'Finch', 'Hasaranga', 'Chameera', 'Theekshana', 'Pathirana', 'Ahmad', 'Zadran', 'ul-Haq', 'Farooqi', 'Rahman', 'Al Hasan', 'Das', 'Ahmed', 'Jansen', 'Brevis', 'Stubbs', 'Klaasen', 'Rossouw', 'Shamsi', 'Ngidi', 'Mitchell', 'Allen', 'Conway', 'Bracewell', 'Phillips', 'Neesham'];

const nationalities = ['Australia', 'England', 'South Africa', 'West Indies', 'New Zealand', 'Afghanistan', 'Sri Lanka', 'Bangladesh'];
const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'];
const tiers = ['B', 'C']; // Mostly B and C for inflation

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateStats(role) {
    const stats = {
        matches: Math.floor(Math.random() * 50) + 5,
        runs: 0,
        battingAvg: 0,
        strikeRate: 0,
        wickets: 0,
        bowlingAvg: 0,
        economy: 0,
        catches: Math.floor(Math.random() * 20),
        fifties: 0,
        hundreds: 0
    };

    if (role === 'Batsman' || role === 'Wicketkeeper' || role === 'All-Rounder') {
        stats.runs = Math.floor(Math.random() * 1500) + 100;
        stats.battingAvg = (Math.random() * 25 + 15).toFixed(2);
        stats.strikeRate = (Math.random() * 40 + 110).toFixed(2);
        stats.fifties = Math.floor(stats.runs / 200);
        stats.hundreds = Math.floor(stats.runs / 800);
    }

    if (role === 'Bowler' || role === 'All-Rounder') {
        stats.wickets = Math.floor(Math.random() * 60) + 5;
        stats.bowlingAvg = (Math.random() * 15 + 20).toFixed(2);
        stats.economy = (Math.random() * 3 + 7).toFixed(2);
    }

    return stats;
}

const extraPlayers = [];
const usedNames = new Set(playersData.map(p => p.name));

for (let i = 0; i < neededCount; i++) {
    const isOverseas = Math.random() > 0.65; // ~35% overseas for variety
    let name = '';
    let nationality = 'India';

    do {
        if (isOverseas) {
            name = `${getRandom(overseasFirstNames)} ${getRandom(overseasLastNames)}`;
            nationality = getRandom(nationalities);
        } else {
            name = `${getRandom(indianFirstNames)} ${getRandom(indianLastNames)}`;
        }
    } while (usedNames.has(name));

    usedNames.add(name);

    const role = getRandom(roles);
    const tier = getRandom(tiers);
    const basePrice = tier === 'B' ? (Math.random() > 0.5 ? 50 : 75) : (Math.random() > 0.5 ? 20 : 30);

    extraPlayers.push({
        name,
        nationality,
        isOverseas,
        role,
        specialization: role === 'Bowler' ? (Math.random() > 0.5 ? 'Right-arm Fast' : 'Right-arm Spin') : (Math.random() > 0.5 ? 'Right-hand Bat' : 'Left-hand Bat'),
        basePrice,
        tier,
        stats: generateStats(role)
    });
}

const finalPool = [...playersData, ...extraPlayers];
fs.writeFileSync(playersPath, JSON.stringify(finalPool, null, 2));

console.log(`✅ Success! Inflated player pool from ${currentCount} to ${finalPool.length} players.`);
