const TelegramBot = require('node-telegram-bot-api');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Konfigurasi manual (tanpa .env)
const BOT_TOKEN = '7732562102:AAEH2ydv6d4q3AamrGoZaoo6ZdFcghQcf-A';
const OWNER_ID = '7673834738'; // dalam bentuk string
const CLIENT_ID = uuidv4().slice(0, 5);

// Inisialisasi bot
const BOT = new TelegramBot(BOT_TOKEN, { polling: true });

// Inisialisasi server Express di port 3000
const app = express();
const port = 3000;

// Daftar fitur yang akan ditampilkan ke pengguna saat mengirim /start
const features = `
  Selamat datang di bot ini! Berikut adalah fitur yang tersedia:
  1. Mengambil screenshot dari halaman tertentu
  2. Kirim screenshot ke owner
  3. Laporan pengunjung
  4. /create - Membuat link untuk mengambil screenshot
`;

// Ketika bot menerima pesan /start
BOT.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.chat.username;
  
  // Mengirimkan daftar fitur yang tersedia
  BOT.sendMessage(chatId, `Halo ${username}! ${features}`);
});

// Ketika bot menerima pesan /create
BOT.onText(/\/create/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Menghasilkan link unik
  const uniqueLink = `https://wulandari-tech-production.up.railway.app/screenshot/${uuidv4()}`;
  
  // Mengirimkan link kepada pengguna
  BOT.sendMessage(chatId, `Klik di sini untuk mengambil screenshot: ${uniqueLink}`);
});

// Endpoint untuk menangani permintaan screenshot dengan link yang di-generate
app.get('/screenshot/:id', async (req, res) => {
  const visitorIp = req.ip;
  const clientId = req.params.id; // Menggunakan ID unik dari URL
  
  // Menentukan URL halaman yang ingin di-screenshot
  const screenshotFilePath = await takeScreenshot('https://wulandari-tech-production.up.railway.app', clientId);

  if (screenshotFilePath) {
    // Kirim screenshot ke Owner via Telegram
    BOT.sendPhoto(OWNER_ID, screenshotFilePath, { caption: `Pengunjung datang dari IP: ${visitorIp}` })
      .then(() => {
        // Kirim respon HTTP setelah screenshot berhasil diambil
        res.send('Screenshot telah diambil dan dikirim ke owner!');
        
        // Hapus file screenshot setelah 10 detik
        setTimeout(() => {
          try {
            fs.unlinkSync(screenshotFilePath);
          } catch (unlinkErr) {
            console.error(`[${clientId}] Gagal menghapus file screenshot:`, unlinkErr);
          }
        }, 10000);
      })
      .catch(err => {
        console.error(`[${clientId}] Gagal kirim screenshot ke owner:`, err.message);
        res.send('Gagal mengambil screenshot.');
      });
  } else {
    res.send('Gagal mengambil screenshot.');
  }
});

// Mulai server Express
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

// Fungsi ambil screenshot pakai Puppeteer
async function takeScreenshot(url, clientId) {
  const fileName = `screenshot_${clientId}_${Date.now()}.png`;
  const filePath = path.join(__dirname, fileName);

  try {
    console.log(`[${clientId}] Mengambil screenshot dari URL: ${url}`);
    const browser = await puppeteer.launch({
      headless: true, // Aktifkan kembali headless untuk produksi
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--disable-gpu',
        // '--verbose', // Tambahkan logging untuk debugging
        // '--show-context' // Mungkin membantu di beberapa lingkungan
      ],
      // executablePath: '/usr/bin/google-chrome' // Ganti dengan path yang benar jika diketahui
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    console.log(`[${clientId}] Halaman dimuat, mengambil screenshot...`);
    await page.screenshot({ path: filePath, fullPage: true });
    await browser.close();

    console.log(`[${clientId}] Screenshot berhasil diambil`);
    return filePath;
  } catch (err) {
    console.error(`[${clientId}] Gagal saat mengambil screenshot:`, err);
    console.error(err.stack); // Cetak stack trace untuk debugging
    return null;
  }
}
