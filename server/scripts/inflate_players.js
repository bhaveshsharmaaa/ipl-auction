import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const playersPath = path.join(__dirname, '..', 'data', 'players.json');
const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf8'));

const TARGET_COUNT = 650;
const currentCount = playersData.length;
const neededCount = TARGET_COUNT - currentCount;

if (neededCount <= 0) {
    console.log(`Pool already has ${currentCount} players. No inflation needed.`);
    process.exit(0);
}

// Real Indian domestic cricket names from Ranji Trophy rosters
const extraIndianNames = [
  'Abhimanyu Singh', 'Aditya Sarvate', 'Ajay Rohera', 'Akshay Wadkar', 'Anubhav Agarwal',
  'Arpit Vasavada', 'Ashok Menaria', 'B Aparajith', 'Babashafi Pathan', 'Brijesh Yadav',
  'C Ganapathy', 'Chama Milind', 'D Hemanth', 'Dharmendrasinh Jadeja', 'Dikshanshu Negi',
  'Faiz Fazal', 'Ganesh Satish', 'Gaurav Yadav', 'Ghanshyam Satpathy', 'Gurinder Singh',
  'Himanshu Mantri', 'Ishwar Pandey', 'J Suchith', 'Jiwanjot Singh', 'K Gowtham',
  'KB Arun Karthik', 'Kedar Devdhar', 'Lukman Meriwala', 'Malolan Rangarajan', 'Mandeep Singh',
  'Milind Kumar', 'N Jagadeesan', 'Naman Ojha', 'P Suyal', 'Paras Dogra',
  'Pramod Chandila', 'R Dhruv', 'Rahil Shah', 'Rajat Bhatia', 'Ranjit Nikam',
  'Rishi Arothe', 'Ronit More', 'S Aravind', 'S Badrinath', 'Samarth R',
  'Shahbaz Nadeem', 'Shivnarayan Chandran', 'Shreyas Mundhe', 'Subodh Bhati', 'Swapnil Gugale',
  'T Pradeep', 'U Chand', 'Upendra Yadav', 'V Koushik', 'Vaibhav Suryavanshi',
  'Vikas Mishra', 'Vishesh Bhriguvanshi', 'Wasim Jaffer Jr', 'Y Gnaneswara Rao', 'Zubayr Hamza',
  'Aakarshit Gomel', 'Abhimanyu Mithun', 'Akshay Karnewar', 'Ankit Bawne', 'Ashok Dinda',
  'Babji Pantha', 'Bipul Sharma', 'C Khurana', 'Chirag Gandhi', 'D Shorey',
  'Dhruv Shorey', 'Eklavya Dwivedi', 'G Vihari', 'Gaurav Jathar', 'Hardik Tamore',
  'Jaskaran Malhotra', 'KV Sharma', 'Khaleel Saab', 'Manprit Juneja', 'N Tilak Naik',
  'P Krishna Rao', 'Paidkal Rahul', 'R Vinay Kumar', 'Rajesh Bishnoi', 'Rishi Suresh',
  'S Sreesanth', 'Sarup Ahlawat', 'Shelley Shaurya', 'Shreyas Khanolkar', 'Sudip Chatterjee',
  'T Kohli', 'V Iyer', 'Vishwanathan Iyer', 'Yash Rathod', 'Zubin Bharucha',
];

// Overseas names from international T20 circuits
const extraOverseasNames = [
  { name: 'Roston Chase', nat: 'West Indies' }, { name: 'Keemo Paul', nat: 'West Indies' },
  { name: 'Khary Pierre', nat: 'West Indies' }, { name: 'Raymon Reifer', nat: 'West Indies' },
  { name: 'Fidel Edwards', nat: 'West Indies' }, { name: 'Gudakesh Motie', nat: 'West Indies' },
  { name: 'Akila Dananjaya', nat: 'Sri Lanka' }, { name: 'Binura Fernando', nat: 'Sri Lanka' },
  { name: 'Chamika Karunaratne', nat: 'Sri Lanka' }, { name: 'Ramesh Mendis', nat: 'Sri Lanka' },
  { name: 'Kasun Rajitha', nat: 'Sri Lanka' }, { name: 'Suranga Lakmal', nat: 'Sri Lanka' },
  { name: 'Ebadot Hossain', nat: 'Bangladesh' }, { name: 'Nasum Ahmed', nat: 'Bangladesh' },
  { name: 'Saif Hassan', nat: 'Bangladesh' }, { name: 'Hasan Mahmud', nat: 'Bangladesh' },
  { name: 'Sean Williams Jr', nat: 'Zimbabwe' }, { name: 'Regis Chakabva', nat: 'Zimbabwe' },
  { name: 'Tendai Chatara', nat: 'Zimbabwe' }, { name: 'Wesley Madhevere', nat: 'Zimbabwe' },
  { name: 'Peter Handscomb', nat: 'Australia' }, { name: 'Ashton Agar', nat: 'Australia' },
  { name: 'Mitch Swepson', nat: 'Australia' }, { name: 'Matt Renshaw', nat: 'Australia' },
  { name: 'Usman Khawaja', nat: 'Australia' }, { name: 'Travis Birt', nat: 'Australia' },
  { name: 'Ollie Robinson', nat: 'England' }, { name: 'Sam Hain', nat: 'England' },
  { name: 'Saqib Mahmood', nat: 'England' }, { name: 'Matt Parkinson', nat: 'England' },
  { name: 'Zak Crawley', nat: 'England' }, { name: 'Will Smeed', nat: 'England' },
  { name: 'Michael Jones', nat: 'England' }, { name: 'Tom Hartley', nat: 'England' },
  { name: 'Scott Kuggeleijn', nat: 'New Zealand' }, { name: 'Blair Tickner', nat: 'New Zealand' },
  { name: 'Ben Sears', nat: 'New Zealand' }, { name: 'Logan van Beek', nat: 'New Zealand' },
  { name: 'Hussain Talat', nat: 'Pakistan' }, { name: 'Shadab Khan', nat: 'Pakistan' },
];

const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'];
const tiers = ['B', 'C'];

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateStats(role) {
    const stats = {
        matches: Math.floor(Math.random() * 50) + 5,
        runs: 0, battingAvg: 0, strikeRate: 0,
        wickets: 0, bowlingAvg: 0, economy: 0,
        catches: Math.floor(Math.random() * 20),
        fifties: 0, hundreds: 0
    };

    if (role === 'Batsman' || role === 'Wicketkeeper' || role === 'All-Rounder') {
        stats.runs = Math.floor(Math.random() * 1500) + 100;
        stats.battingAvg = parseFloat((Math.random() * 25 + 15).toFixed(2));
        stats.strikeRate = parseFloat((Math.random() * 40 + 110).toFixed(2));
        stats.fifties = Math.floor(stats.runs / 200);
        stats.hundreds = Math.floor(stats.runs / 800);
    }

    if (role === 'Bowler' || role === 'All-Rounder') {
        stats.wickets = Math.floor(Math.random() * 60) + 5;
        stats.bowlingAvg = parseFloat((Math.random() * 15 + 20).toFixed(2));
        stats.economy = parseFloat((Math.random() * 3 + 7).toFixed(2));
    }

    return stats;
}

const extraPlayers = [];
const usedNames = new Set(playersData.map(p => p.name));

// Add Indian names first
for (const name of extraIndianNames) {
    if (extraPlayers.length >= neededCount) break;
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const role = getRandom(roles);
    const tier = getRandom(tiers);
    extraPlayers.push({
        name,
        nationality: 'India',
        isOverseas: false,
        role,
        specialization: role,
        basePrice: tier === 'B' ? (Math.random() > 0.5 ? 50 : 75) : (Math.random() > 0.5 ? 20 : 30),
        tier,
        stats: generateStats(role)
    });
}

// Add overseas names
for (const p of extraOverseasNames) {
    if (extraPlayers.length >= neededCount) break;
    if (usedNames.has(p.name)) continue;
    usedNames.add(p.name);

    const role = getRandom(roles);
    const tier = getRandom(tiers);
    extraPlayers.push({
        name: p.name,
        nationality: p.nat,
        isOverseas: true,
        role,
        specialization: role,
        basePrice: tier === 'B' ? (Math.random() > 0.5 ? 50 : 75) : (Math.random() > 0.5 ? 20 : 30),
        tier,
        stats: generateStats(role)
    });
}

const finalPool = [...playersData, ...extraPlayers];
fs.writeFileSync(playersPath, JSON.stringify(finalPool, null, 2));

console.log(`Done! Inflated player pool from ${currentCount} to ${finalPool.length} players.`);
