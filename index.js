const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chatFile = path.join(__dirname, 'chat.json');

if (!fs.existsSync(chatFile)) fs.writeFileSync(chatFile, '[]');

app.use('/socket.io', express.static(path.join(__dirname, 'node_modules/socket.io/client-dist')));

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/chat', (_, res) => {
  const data = fs.readFileSync(chatFile, 'utf-8');
  res.json(JSON.parse(data));
});

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, __dirname),
  filename: (_, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  res.json({ url: `/${req.file.filename}` });
});

app.use(express.static(__dirname)); // untuk akses avatar

io.on('connection', (socket) => {
  const history = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
  socket.emit('chat history', history);

  socket.on('chat message', (msg) => {
    const messages = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
    messages.push(msg);
    fs.writeFileSync(chatFile, JSON.stringify(messages.slice(-100))); // batasi 100 chat terakhir
    io.emit('chat message', msg);
  });
});

server.listen(3000, () => {
  console.log('Server jalan di http://localhost:3000');
});
