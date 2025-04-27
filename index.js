const express = require('express');
const { WebSocketServer } = require('ws');
const wanzofcHunter = require('wanzofc-hunter');

const app = express();
const port = 3000;
const wsPort = 3001;
wanzofcHunter.configure({
  websocketURL: `ws://localhost:${wsPort}`,
  payloadAttribute: 'data-wanzofc',
  targetElementId: 'wanzofc-result',
});

app.use(express.json()); // Middleware untuk parsing body JSON

// Middleware wanzofc-hunter
app.use(wanzofcHunter.expressMiddleware());

// Rute
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head><title>Wanzofc Hunter Test</title></head>
    <body>
      <h1>Hello, world!</h1>
      <div id="wanzofc-result"></div>
      <script>
        window.wanzofcReport = function(data) {
          console.log("Report:", data);
          // Kirim data ke server Anda (misalnya, menggunakan fetch)
          fetch('/report-xss', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
          });
        };
      </script>
    </body>
    </html>
  `);
});

app.post('/report-xss', (req, res) => {
  console.log("XSS Report Recieved", req.body);
  res.status(200).send({ message: "Report Recieved" });
});

// ** Bagian WebSocket Server **

// Buat HTTP server untuk Express
const server = app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});

// Inisialisasi WebSocket server
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', ws => {
  console.log('Client connected via WebSocket');
  ws.on('message', message => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received data:', data);
    } catch (e) { console.error('Failed to parse message:', e); }
  });
  ws.on('close', () => console.log('Client disconnected'));
});

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request);
    });
  } else { socket.destroy(); }
});
