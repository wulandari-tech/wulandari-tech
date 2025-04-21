const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;
const TURN_ID_TOKEN = 'cbdf074d40fbee927a262f1cc537c0e1';
const TURN_API_TOKEN = '1be8717db2849051b2a7e9ffb56a5cf5d2765349b9cd9598573a8ae934a2b946';
const MONGO_URI = 'mongodb+srv://zanssxploit:pISqUYgJJDfnLW9b@cluster0.fgram.mongodb.net/?retryWrites=true&w=majority';
const messageSchema = new mongoose.Schema({
    sender: String,
    text: String,
    timestamp: { type: Number, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));
function generateCredentials() {
    const timestamp = Math.floor(Date.now() / 1000) + 3600;
    const username = `${timestamp}:square shape e9ce`; 
    const hmac = crypto.createHmac('sha1', TURN_API_TOKEN);
    hmac.update(username);
    const credential = hmac.digest('base64');
    return { username, credential };
}
app.get('/ice', (req, res) => {
    const { username, credential } = generateCredentials();
    const iceServers = {
        iceServers: [
            {
                urls: [
                    "stun:stun.cloudflare.com:3478",
                    "turn:turn.cloudflare.com:3478?transport=udp",
                    "turn:turn.cloudflare.com:3478?transport=tcp",
                    "turns:turn.cloudflare.com:5349?transport=tcp"
                ],
                username: username,
                credential: credential,
            }
        ]
    };
    res.json(iceServers);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
wss.on('connection', ws => {
    console.log('Client connected');

    Message.find().sort({ timestamp: 1 }).then(messages => {
        ws.send(JSON.stringify({ type: 'history', messages }));
    }).catch(err => {
        console.error("Error loading chat history:", err);
        ws.send(JSON.stringify({ type: 'history', messages: [] }));
    });
    ws.on('message', message => {
        try {
            const msg = JSON.parse(message);
            if (msg.type === 'message') {
                const newMessage = new Message({
                    sender: msg.sender,
                    text: msg.text,
                });
                newMessage.save().then(savedMessage => {
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'message', message: savedMessage }));
                        }
                    });
                }).catch(err => console.error('Failed to save message:', err));
            } else if (msg.type === 'sdp' || msg.type === 'candidate') {
                wss.clients.forEach(client => {
                  if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: msg.type,
                      sender: msg.sender,
                      data: msg.data,
                    }));
                  }
                });
              }
        } catch (error) {
            console.error("Failed to process message:", error);
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
    ws.on('error', error => {
        console.error('WebSocket error:', error);
    });
});

server.listen(port, () => console.log(`Server listening on port ${port}`));
