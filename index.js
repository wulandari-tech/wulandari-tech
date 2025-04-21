// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '.'),
  filename: (req, file, cb) => cb(null, 'avatar_' + uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage });
mongoose.connect('mongodb+srv://zanssxploit:pISqUYgJJDfnLW9b@cluster0.fgram.mongodb.net/?retryWrites=true&w=majority');
const ChatSchema = new mongoose.Schema({
  userId: String,
  username: String,
  avatar: String,
  color: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', ChatSchema);

app.use(express.json());
app.use('/avatar', express.static('.'));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  res.json({ url: `/avatar/${req.file.filename}` });
});

io.on('connection', async (socket) => {
  const history = await Chat.find().sort({ timestamp: 1 }).limit(100);
  socket.emit('chat history', history);

  socket.on('chat message', async (data) => {
    const newChat = new Chat(data);
    await newChat.save();
    io.emit('chat message', newChat);
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
