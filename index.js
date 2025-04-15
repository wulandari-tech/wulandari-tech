const TelegramBot = require('node-telegram-bot-api');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Konfigurasi manual (tanpa .env)
const BOT_TOKEN = 'ISI_TOKEN_BOT_TELEGRAM_KAMU';
const OWNER_ID = 'ISI_ID_TELEGRAM_KAMU'; // dalam bentuk string
const CLIENT_ID = uuidv4().slice(0, 5);

// Inisialisasi bot
const BOT = new TelegramBot(BOT_TOKEN, { polling: true });

console.log(`[${CLIENT_ID}] Bot berjalan...`);

BOT.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const message = `Halo *${msg.from.first_name || 'Pengguna'}*!\n\n` +
    `Saya aktif sebagai client.\n\n*ID Client:* \`${CLIENT_ID}\`\n` +
    (msg.from.id.toString() === OWNER_ID ? '\nAnda adalah *OWNER*. Anda bisa menggunakan fitur penuh.' : '');

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: msg.from.id.toString() === OWNER_ID ? [
        [{ text: '🧪 Create Link', callback_data: `create_link_${CLIENT_ID}` }]
      ] : []
    }
  };

  BOT.sendMessage(chatId, message, options);
});

// Command Screenshot
BOT.onText(/\/ss (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];

  if (!url.startsWith('http')) {
    return BOT.sendMessage(chatId, `Masukkan URL valid dimulai dengan http atau https`);
  }

  BOT.sendMessage(chatId, `Mengambil screenshot dari:\n${url}...`);

  const filePath = await takeScreenshot(url, CLIENT_ID);
  if (filePath) {
    BOT.sendPhoto(chatId, filePath, { caption: `Screenshot dari ${url}` });
    setTimeout(() => fs.unlinkSync(filePath), 10000);
  } else {
    BOT.sendMessage(chatId, `Gagal mengambil screenshot.`);
  }
});

// Tombol Inline (Create Link)
BOT.on('callback_query', async (query) => {
  const { data, message, from } = query;

  if (from.id.toString() !== OWNER_ID) {
    return BOT.answerCallbackQuery(query.id, { text: 'Khusus Owner!', show_alert: true });
  }

  if (data.startsWith('create_link_')) {
    const clientId = data.split('_')[2];
    const dummyLink = `https://example.com/access/${clientId}`;
    BOT.editMessageText(`Link berhasil dibuat:\n\n${dummyLink}`, {
      chat_id: message.chat.id,
      message_id: message.message_id
    });
  }
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
