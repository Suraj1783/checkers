import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

interface Room {
  code: string;
  host: string;
  guest: string | null;
  hostColor: 'black' | 'white';
  gameState: any;
  createdAt: number;
}

interface Player {
  socketId: string;
  username: string;
  roomCode: string | null;
}

const rooms = new Map<string, Room>();
const players = new Map<string, Player>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (username: string) => {
    const roomCode = generateRoomCode();
    const hostColor: 'black' | 'white' = Math.random() > 0.5 ? 'black' : 'white';

    const room: Room = {
      code: roomCode,
      host: socket.id,
      guest: null,
      hostColor,
      gameState: null,
      createdAt: Date.now()
    };

    rooms.set(roomCode, room);
    players.set(socket.id, {
      socketId: socket.id,
      username: username || 'Player',
      roomCode
    });

    socket.join(roomCode);
    socket.emit('room-created', {
      roomCode,
      playerColor: hostColor,
      isHost: true
    });

    console.log(`Room created: ${roomCode} by ${socket.id}`);
  });

  socket.on('join-room', ({ roomCode, username }: { roomCode: string; username: string }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.guest) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    room.guest = socket.id;
    players.set(socket.id, {
      socketId: socket.id,
      username: username || 'Player',
      roomCode
    });

    socket.join(roomCode);

    const guestColor = room.hostColor === 'black' ? 'white' : 'black';

    socket.emit('room-joined', {
      roomCode,
      playerColor: guestColor,
      isHost: false
    });

    const hostPlayer = players.get(room.host);
    const guestPlayer = players.get(socket.id);

    io.to(roomCode).emit('game-start', {
      hostUsername: hostPlayer?.username || 'Player 1',
      guestUsername: guestPlayer?.username || 'Player 2',
      hostColor: room.hostColor
    });

    console.log(`Player ${socket.id} joined room ${roomCode}`);
  });

  socket.on('make-move', ({ roomCode, gameState, move }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.gameState = gameState;
      socket.to(roomCode).emit('game-update', { gameState, move });
    }
  });

  socket.on('chat-message', ({ roomCode, message }) => {
    const player = players.get(socket.id);
    if (player) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      io.to(roomCode).emit('chat-message', {
        id: `${Date.now()}-${socket.id}`,
        username: player.username,
        message,
        timestamp: Date.now(),
        color
      });
    }
  });

  socket.on('game-end', ({ roomCode, winner }) => {
    socket.to(roomCode).emit('game-end', { winner });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const player = players.get(socket.id);

    if (player && player.roomCode) {
      const room = rooms.get(player.roomCode);
      if (room) {
        io.to(player.roomCode).emit('player-disconnected');
        rooms.delete(player.roomCode);
      }
    }

    players.delete(socket.id);
  });
});

setInterval(() => {
  const now = Date.now();
  const ROOM_TIMEOUT = 2 * 60 * 60 * 1000;

  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > ROOM_TIMEOUT) {
      rooms.delete(code);
      console.log(`Room ${code} expired`);
    }
  }
}, 60 * 1000);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
