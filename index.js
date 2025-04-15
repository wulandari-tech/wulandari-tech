const TelegramBot = require('node-telegram-bot-api');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
// const puppeteer = require('puppeteer');  // Hapus baris ini
const fs = require('fs');
const path = require('path');
const express = require('express');
const geoip = require('geoip-lite'); // Untuk mendapatkan lokasi dari IP
const axios = require('axios'); // Untuk mendapatkan informasi lokasi (alternatif)

// Konfigurasi manual (tanpa .env)
const BOT_TOKEN = '7732562102:AAEH2ydv6d4q3AamrGoZaoo6ZdFcghQcf-A';
const OWNER_ID = '7673834738'; // dalam bentuk string
const CLIENT_ID = uuidv4().slice(0, 5);

// Inisialisasi bot
const BOT = new TelegramBot(BOT_TOKEN, { polling: true });

// Inisialisasi server Express di port 3000
const app = express();
const port = 3000;

// Hapus middleware untuk menyajikan file statis (karena tidak ada folder publik)
// app.use(express.static('public'));  // Hapus baris ini

// Endpoint untuk menangani akses ke root ("/")
app.get('/', async (req, res) => {
    const ip = req.ip;  // Mendapatkan IP address

    // Kirim informasi ke owner melalui bot
    try {
        const locationInfo = await getLocationInfo(ip);  // Dapatkan informasi lokasi
        const timestamp = new Date().toLocaleString();
        const message = `
        Pengunjung baru!\n
        IP: ${ip}\n
        Waktu: ${timestamp}\n
        Lokasi: ${locationInfo || 'Tidak dapat ditemukan'}
        `;
        BOT.sendMessage(OWNER_ID, message);
        console.log(message); // Log di console server
    } catch (error) {
        console.error('Error getting location or sending message:', error);
        BOT.sendMessage(OWNER_ID, `Error saat mendapatkan informasi pengunjung: IP: ${ip}`);
    }

    // Kirim index.html
    res.sendFile(path.join(__dirname, 'index.html')); // Pastikan index.html ada di folder proyek
});

// Fungsi untuk mendapatkan informasi lokasi dari IP (menggunakan geoip-lite)
async function getLocationInfo(ip) {
    try {
        const geo = geoip.lookup(ip);
        if (geo) {
            return `${geo.city}, ${geo.country}`;
        }
        return 'Tidak dapat ditemukan';
    } catch (error) {
        console.error('Error looking up location:', error);
        return 'Tidak dapat ditemukan (error geoip)';
    }
}


// Fungsi untuk mendapatkan informasi lokasi dari IP (menggunakan alternatif axios)
//  Jika geoip-lite gagal,  coba metode ini.
async function getLocationInfoAlternative(ip) {
    try {
        const response = await axios.get(`https://ipinfo.io/${ip}?token=4ed2c4496226d5`); // Ganti dengan token ipinfo Anda jika ada
        if (response.data && response.data.city && response.data.country) {
            return `${response.data.city}, ${response.data.country}`;
        }
        return 'Tidak dapat ditemukan';
    } catch (error) {
        console.error('Error getting location (axios):', error);
        return 'Tidak dapat ditemukan (axios error)';
    }
}



// Hapus fungsi takeScreenshot (tidak digunakan lagi)
// async function takeScreenshot(url, clientId) {
//     const fileName = `screenshot_${clientId}_${Date.now()}.png`;
//     const filePath = path.join(__dirname, fileName);

//     try {
//         console.log(`[${clientId}] Mengambil screenshot dari URL: ${url}`);
//         const browser = await puppeteer.launch({
//             headless: true,
//             args: [
//                 '--no-sandbox',
//                 '--disable-setuid-sandbox',
//                 '--disable-dev-shm-usage',
//                 '--disable-accelerated-2d-canvas',
//                 '--no-zygote',
//                 '--disable-gpu',
//             ],
//         });

//         const page = await browser.newPage();
//         await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
//         console.log(`[${clientId}] Halaman dimuat, mengambil screenshot...`);
//         await page.screenshot({ path: filePath, fullPage: true });
//         await browser.close();

//         console.log(`[${clientId}] Screenshot berhasil diambil`);
//         return filePath;
//     } catch (err) {
//         console.error(`[${clientId}] Gagal saat mengambil screenshot:`, err);
//         console.error(err.stack);
//         return null;
//     }
// }



// Mulai server Express
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
