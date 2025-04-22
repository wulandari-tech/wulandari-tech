const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// In-memory chat history
let chatHistory = [];

// Middleware untuk serve file statis
app.use(express.static(path.join(__dirname, '')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// Endpoint untuk meng-upload avatar
app.post('/upload-avatar', (req, res) => {
  const file = req.files?.avatar;
  if (file) {
    const uploadPath = path.join(__dirname, 'uploads', file.name);
    file.mv(uploadPath, (err) => {
      if (err) return res.status(500).send({ message: 'Error uploading file' });
      res.json({ url: `/uploads/${file.name}` });
    });
  } else {
    res.status(400).send({ message: 'No file uploaded' });
  }
});

// Endpoint untuk mengakses chat history
app.get('/chat', (req, res) => {
  res.json(chatHistory);
});

// Socket.io untuk komunikasi realtime
io.on('connection', (socket) => {
  console.log('A user connected');

  // Kirim chat history saat pengguna baru terhubung
  socket.emit('chat history', chatHistory);

  // Mendengarkan pesan dari pengguna
  socket.on('chat message', (msg) => {
    // Menyimpan pesan baru ke dalam chat history
    chatHistory.push(msg);

    // Broadcast pesan ke semua pengguna
    io.emit('chat message', msg);
  });

  // Ketika pengguna terputus
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Set port dan start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
