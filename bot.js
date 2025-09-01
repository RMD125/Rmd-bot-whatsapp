const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration Express pour Render
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🤖 RMD Bot WhatsApp</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        h1 { color: #25D366; }
        .status { padding: 10px; margin: 10px; border-radius: 5px; }
        .online { background-color: #DFF2BF; color: #4F8A10; }
      </style>
    </head>
    <body>
      <h1>🤖 RMD Bot WhatsApp</h1>
      <p>Bot WhatsApp Premium développé par <strong>RMD125</strong></p>
      <div class="status online">🟢 En ligne et opérationnel</div>
      <p>Utilisez WhatsApp pour interagir avec le bot</p>
      <p><strong>Contact:</strong> +228 96 19 09 34 | +228 96 12 40 78</p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🤖 Serveur démarré sur le port ${PORT}`);
  connectToWhatsApp();
});

// Stockage en mémoire pour les sessions
const store = makeInMemoryStore({});
store.readFromFile('./baileys_store.json');
setInterval(() => {
  store.writeToFile('./baileys_store.json');
}, 10_000);

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();
  
