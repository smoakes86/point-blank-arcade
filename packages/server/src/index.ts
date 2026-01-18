import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { GameRoom } from './rooms/GameRoom.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Point Blank Server' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

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
