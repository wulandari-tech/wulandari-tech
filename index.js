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

app.get('/', async (req, res) => {
  const visitorIp = req.ip;
  const screenshotFilePath = await takeScreenshot('https://wulandari-tech-production.up.railway.app', CLIENT_ID); // URL bisa disesuaikan

  // Kirim screenshot ke Owner via Telegram
  BOT.sendPhoto(OWNER_ID, screenshotFilePath, { caption: `Pengunjung datang dari IP: ${visitorIp}` })
    .then(() => {
      // Kirim respon HTTP setelah screenshot berhasil diambil
      res.send('Screenshot telah diambil dan dikirim ke owner!');
      
      // Hapus file screenshot setelah 10 detik
      setTimeout(() => fs.unlinkSync(screenshotFilePath), 10000);
    })
    .catch(err => {
      console.error(`[${CLIENT_ID}] Gagal kirim screenshot ke owner:`, err.message);
      res.send('Gagal mengambil screenshot.');
    });
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
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: filePath, fullPage: true });
    await browser.close();
    return filePath;
  } catch (err) {
    console.error(`[${clientId}] Gagal screenshot:`, err.message);
    return null;
  }
}
