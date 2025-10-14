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
const rooms = new Map();
const players = new Map();

function normalizeCode(code) {
    return (typeof code === 'string') ? code.trim().toUpperCase() : undefined;
}

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return rooms.has(code) ? generateRoomCode() : code;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', (payload) => {
        const username = (typeof payload === 'string') ? payload : (payload?.username || 'Player');
        console.log('create-room payload:', payload);
        const roomCode = generateRoomCode();
        const hostColor = Math.random() > 0.5 ? 'black' : 'white';
        const room = {
            code: roomCode,
            host: socket.id,
            guest: null,
            hostColor,
            gameState: null,
            createdAt: Date.now(),
            lastSeen: Date.now()
        };
        rooms.set(roomCode, room);
        players.set(socket.id, {
            socketId: socket.id,
            username,
            roomCode
        });
        socket.join(roomCode);

        const clientBase = process.env.CLIENT_URL || 'http://localhost:3000';
        const inviteLink = `${clientBase}/join/${roomCode}`;

        socket.emit('room-created', {
            roomCode,
            playerColor: hostColor,
            isHost: true,
            inviteLink
        });
        console.log(`Room created: ${roomCode} by ${socket.id}`);
    });

    // allow a reconnecting client to claim an existing room as host
    socket.on('claim-host', (payload) => {
        const code = (typeof payload === 'string') ? normalizeCode(payload) : normalizeCode(payload?.roomCode);
        const username = (typeof payload === 'object') ? payload?.username : (typeof payload === 'string' ? undefined : undefined);
        console.log('claim-host payload:', payload, 'code:', code);
        if (!code) {
            socket.emit('room-error', { message: 'Invalid room code' });
            return;
        }
        const room = rooms.get(code);
        if (!room) {
            socket.emit('room-error', { message: 'Room not found' });
            return;
        }

        // assign this socket as host (reclaim) even if previous host was disconnected
        room.host = socket.id;
        room.lastSeen = Date.now();
        players.set(socket.id, {
            socketId: socket.id,
            username: username || 'Player',
            roomCode: code
        });
        socket.join(code);

        socket.emit('host-claimed', {
            roomCode: code,
            playerColor: room.hostColor,
            isHost: true
        });
        io.to(code).emit('host-reclaimed', { hostId: socket.id, hostUsername: username || 'Player' });
        console.log(`Host reclaimed room ${code} by ${socket.id}`);
    });

    socket.on('join-room', (payload) => {
        const roomCode = (typeof payload === 'string') ? normalizeCode(payload) : normalizeCode(payload?.roomCode);
        const username = (typeof payload === 'object') ? payload?.username : undefined;
        console.log('join-room payload:', payload, 'normalized code:', roomCode);
        if (!roomCode) {
            socket.emit('room-error', { message: 'Invalid room code' });
            return;
        }
        const room = rooms.get(roomCode);
        if (!room) {
            socket.emit('room-error', { message: 'Room not found' });
            return;
        }
        if (room.guest) {
            socket.emit('room-error', { message: 'Room is full' });
            return;
        }

        // allow join even if host is currently disconnected; guest will join the room namespace
        room.guest = socket.id;
        room.lastSeen = Date.now();
        players.set(socket.id, {
            socketId: socket.id,
            username: username || 'Player',
            roomCode: roomCode
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
            room.lastSeen = Date.now();
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
                // don't immediately delete the room; mark missing host/guest and keep for reclaim
                if (room.host === socket.id) {
                    room.host = null;
                    room.lastSeen = Date.now();
                    io.to(player.roomCode).emit('player-disconnected', { role: 'host' });
                    console.log(`Host ${socket.id} disconnected from room ${player.roomCode} (room preserved)`);
                } else if (room.guest === socket.id) {
                    room.guest = null;
                    room.lastSeen = Date.now();
                    io.to(player.roomCode).emit('player-disconnected', { role: 'guest' });
                    console.log(`Guest ${socket.id} disconnected from room ${player.roomCode}`);
                }

                // if both slots are empty, delete the room immediately
                if (!room.host && !room.guest) {
                    rooms.delete(player.roomCode);
                    console.log(`Room ${player.roomCode} deleted (both players left)`);
                }
            }
        }
        players.delete(socket.id);
    });
});

setInterval(() => {
    const now = Date.now();
    const ROOM_TIMEOUT = 2 * 60 * 60 * 1000;
    for (const [code, room] of rooms.entries()) {
        // delete rooms that are older than timeout OR have no players and were inactive
        if (now - room.createdAt > ROOM_TIMEOUT) {
            rooms.delete(code);
            console.log(`Room ${code} expired`);
            continue;
        }
        if (!room.host && !room.guest && now - (room.lastSeen || room.createdAt) > 5 * 60 * 1000) {
            // remove empty/inactive rooms after 5 minutes
            rooms.delete(code);
            console.log(`Room ${code} removed (inactive, no players)`);
        }
    }
}, 60 * 1000);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// add endpoint to validate a room exists (useful before redirecting a guest)
app.get('/room/:code', (req, res) => {
    const code = normalizeCode(req.params.code);
    const room = rooms.get(code);
    if (!room) return res.status(404).json({ exists: false });
    return res.json({
        exists: true,
        code: room.code,
        hostColor: room.hostColor,
        createdAt: room.createdAt,
        hasHost: !!room.host,
        hasGuest: !!room.guest
    });
});
