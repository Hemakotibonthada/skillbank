require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'skillbank' }));
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
app.use('/api', routes);
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html')));

// Socket.io for real-time features
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  socket.on('user:online', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('users:online', { count: onlineUsers.size, users: [...onlineUsers.keys()] });
  });

  socket.on('message:send', (data) => {
    const recipientSocket = onlineUsers.get(data.to_id);
    if (recipientSocket) {
      io.to(recipientSocket).emit('message:new', data);
    }
  });

  socket.on('typing:start', (data) => {
    const recipientSocket = onlineUsers.get(data.to_id);
    if (recipientSocket) io.to(recipientSocket).emit('typing:show', data);
  });

  socket.on('typing:stop', (data) => {
    const recipientSocket = onlineUsers.get(data.to_id);
    if (recipientSocket) io.to(recipientSocket).emit('typing:hide', data);
  });

  socket.on('exchange:update', (data) => {
    io.emit('exchange:changed', data);
  });

  socket.on('notification:send', (data) => {
    const recipientSocket = onlineUsers.get(data.to_id);
    if (recipientSocket) io.to(recipientSocket).emit('notification:new', data);
  });

  socket.on('disconnect', () => {
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) { onlineUsers.delete(userId); break; }
    }
    io.emit('users:online', { count: onlineUsers.size, users: [...onlineUsers.keys()] });
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => console.log(`🤝 SkillBank server running on http://localhost:${PORT}`));
