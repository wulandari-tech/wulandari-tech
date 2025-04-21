// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;
const TURN_ID_TOKEN = 'cbdf074d40fbee927a262f1cc537c0e1';
const TURN_API_TOKEN = '1be8717db2849051b2a7e9ffb56a5cf5d2765349b9cd9598573a8ae934a2b946';
let chatHistory = [];
try {
    const data = fs.readFileSync('chat.json');
    chatHistory = JSON.parse(data);
} catch (err) {
    console.error("Tidak dapat memuat riwayat obrolan:", err); // Tangani kesalahan, misalnya jika file tidak ada
}



function generateCredentials() {
    // ... (sama seperti sebelumnya)
}

app.get('/ice', (req, res) => {
    // ... (sama seperti sebelumnya)
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

wss.on('connection', ws => {
    console.log('Client connected');


    // Mengirim riwayat obrolan ke klien yang baru terhubung
    ws.send(JSON.stringify({ type: 'history', messages: chatHistory }));


    ws.on('message', message => {
        try {
            const msg = JSON.parse(message);

            switch(msg.type) {
                case 'message':
                    const newMessage = {
                        sender: msg.sender,
                        text: msg.text,
                        timestamp: Date.now()
                    };
                    chatHistory.push(newMessage);
                    
                    // Simpan riwayat obrolan ke file
                    fs.writeFileSync('chat.json', JSON.stringify(chatHistory, null, 2));

                    // Broadcast pesan ke semua klien
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'message', message: newMessage }));
                        }
                    });
                    break;

                // Tambahkan case lain untuk tipe pesan lain (misalnya, "offer", "answer", "ice")

                default:
                    console.log('Unknown message type:', msg.type);

            }

        } catch (error) {
            console.error("Gagal memproses pesan:", error);
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
