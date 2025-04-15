const TelegramBot = require('node-telegram-bot-api');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
// const puppeteer = require('puppeteer');  // Hapus
const fs = require('fs');
const path = require('path');
const express = require('express');
const geoip = require('geoip-lite');
// const axios = require('axios'); // Hapus

// Konfigurasi manual (tanpa .env)
const BOT_TOKEN = '7732562102:AAEH2ydv6d4q3AamrGoZaoo6ZdFcghQcf-A';
const OWNER_ID = '7673834738'; // dalam bentuk string
const CLIENT_ID = uuidv4().slice(0, 5);

// Inisialisasi bot
const BOT = new TelegramBot(BOT_TOKEN, { polling: true });

// Inisialisasi server Express di port 3000
const app = express();
const port = 3000;

// Endpoint untuk menangani akses ke root ("/")
app.get('/', async (req, res) => {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers.referer || 'Tidak ada';

    // Bersihkan IPv6 jika diperlukan
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    const now = new Date();
    let greeting;
    const hour = now.getHours();

    if (hour >= 5 && hour < 12) {
        greeting = "Selamat Pagi";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Selamat Siang";
    } else if (hour >= 17 && hour < 20) {
        greeting = "Selamat Sore";
    } else {
        greeting = "Selamat Malam";
    }

    try {
        const locationInfo = await getLocationInfo(ip);
        const timestamp = now.toLocaleString();

        const message = `
        ✨ ${greeting}! ✨\n
        📡 IP: \`${ip}\`\n
        ⌚ Waktu: \`${timestamp}\`\n
        🗺️ Lokasi: \`${locationInfo || 'Tidak dapat ditemukan'}\`\n
        💻 User-Agent: \`${userAgent || 'Tidak diketahui'}\`\n
        🔗 Referer: \`${referer}\`
        `;

        BOT.sendMessage(OWNER_ID, message, { parse_mode: 'MarkdownV2' });
        console.log(message);
    } catch (error) {
        console.error('Error getting location or sending message:', error);
        BOT.sendMessage(OWNER_ID, `⚠️ Error saat mendapatkan informasi pengunjung: IP: \`${req.ip}\` - ${error.message}`, { parse_mode: 'MarkdownV2' });
    }

    res.sendFile(path.join(__dirname, 'index.html'));
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

// Hapus fungsi getLocationInfoAlternative (tidak diperlukan)
// Hapus fungsi takeScreenshot (tidak digunakan lagi)

// Perintah /serverinfo
BOT.onText(/\/serverinfo/, (msg) => {
    const chatId = msg.chat.id;

    const serverInfo = `
        💻 Server Info:\n
        OS: ${os.platform()} ${os.release()}\n
        Arsitektur: ${os.arch()}\n
        Hostname: ${os.hostname()}\n
        Uptime: ${formatUptime(os.uptime())}\n
        RAM: ${formatRAM(os.totalmem(), os.freemem())}
    `;
    BOT.sendMessage(chatId, serverInfo, { parse_mode: 'MarkdownV2' });
});

// Fungsi format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / (60 * 60 * 24));
    seconds %= (60 * 60 * 24);
    const hours = Math.floor(seconds / (60 * 60));
    seconds %= (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds) parts.push(`${seconds}s`);

    return parts.join(' ');
}

// Fungsi format RAM
function formatRAM(total, free) {
    const totalGB = (total / 1024 / 1024 / 1024).toFixed(2);
    const freeGB = (free / 1024 / 1024 / 1024).toFixed(2);
    return `${freeGB}GB / ${totalGB}GB`;
}


// Menangani perintah /start dengan tombol
BOT.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username;
    const greeting = `Halo ${username}! Selamat datang di bot ini.`;

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Info Server', callback_data: 'server_info' },
                    { text: 'Tentang', callback_data: 'about' }
                ]
            ]
        }
    };

    BOT.sendMessage(chatId, greeting, keyboard);
});


// Menangani callback dari tombol
BOT.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    switch (data) {
        case 'server_info':
            const serverInfo = `
                💻 Server Info:\n
                OS: ${os.platform()} ${os.release()}\n
                Arsitektur: ${os.arch()}\n
                Hostname: ${os.hostname()}\n
                Uptime: ${formatUptime(os.uptime())}\n
                RAM: ${formatRAM(os.totalmem(), os.freemem())}
            `;
            BOT.editMessageText(serverInfo, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'MarkdownV2'
            });

            break;
        case 'about':
            BOT.editMessageText('Bot ini dibuat untuk tujuan demonstrasi.  Silakan hubungi owner untuk info lebih lanjut.', {
                chat_id: chatId,
                message_id: messageId
            });
            break;
        default:
            BOT.editMessageText('Perintah tidak dikenal.', {
                chat_id: chatId,
                message_id: messageId
            });
    }

    // Konfirmasi callback query
    BOT.answerCallbackQuery(callbackQuery.id);
});

// Mulai server Express
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
