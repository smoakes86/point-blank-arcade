import { Server, matchMaker } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { GameRoom } from './rooms/GameRoom.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/api/status', (_req, res) => {
  res.json({ status: 'ok', message: 'Point Blank Server' });
});

// Look up Colyseus room ID by custom room code
app.get('/api/room/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    const rooms = await matchMaker.query({ name: 'game' });
    for (const room of rooms) {
      // Access the room's state to check the custom roomCode
      const gameRoom = matchMaker.getRoomById(room.roomId);
      if (gameRoom && (gameRoom.state as { roomCode?: string })?.roomCode?.toUpperCase() === code) {
        return res.json({ roomId: room.roomId });
      }
    }
    res.status(404).json({ error: 'Room not found' });
  } catch (error) {
    console.error('Error looking up room:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve static files for game client and phone controller
const gameClientPath = join(__dirname, '../../game-client/dist');
const phoneControllerPath = join(__dirname, '../../phone-controller/dist');

// Phone controller at /controller
if (existsSync(phoneControllerPath)) {
  app.use('/controller', express.static(phoneControllerPath));
  app.get('/controller/*', (_req, res) => {
    res.sendFile(join(phoneControllerPath, 'index.html'));
  });
}

// Game client at root
if (existsSync(gameClientPath)) {
  app.use(express.static(gameClientPath));
  app.get('*', (req, res, next) => {
    // Skip API and WebSocket routes
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(join(gameClientPath, 'index.html'));
  });
}

const server = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
  }),
});

// Register the game room
gameServer.define('game', GameRoom);

const PORT = parseInt(process.env.PORT || '3001', 10);

gameServer.listen(PORT).then(() => {
  console.log(`🎯 Point Blank server listening on port ${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   HTTP: http://localhost:${PORT}`);
});
