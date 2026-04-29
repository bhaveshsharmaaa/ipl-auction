import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import { setupSocket } from './socket/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/auth.js';
import lobbyRoutes from './routes/lobby.js';
import playerRoutes from './routes/player.js';
import auctionRoutes from './routes/auction.js';


const app = express();
const httpServer = createServer(app);

// Rate Limiting - Basic protection against DDoS/brute-force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for easier integration with CDNs/Logos for now, can be hardened later
}));
app.use(compression()); // Compress all responses
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' })); // Body parser with limit

// CORS Setup
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// API Routes
app.use('/api/auth', limiter, authRoutes); // Apply rate limit to auth
app.use('/api/lobby', lobbyRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auction', auctionRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString() 
  });
});

// Serving static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));

  // Catch-all route to serve the built index.html for React Router
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});
setupSocket(io);
app.set('io', io);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Connect to DB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🏏 IPL Auction API ready!\n`);
  });
});
