const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration Express pour Render
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

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('📱 Scannez le QR code ci-dessus pour vous connecter');
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`🔌 Connection closed, reconnecting ${shouldReconnect}`);
      
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('✅ Connecté avec succès à WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
  
  // Gestion des messages
  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];
    if (!message.key.fromMe && m.type === 'notify') {
      await sock.readMessages([message.key]);
      
      const text = getMessageText(message);
      const jid = message.key.remoteJid;
      const isGroup = jid.endsWith('@g.us');
      
      console.log(`📨 Message reçu: ${text}`);
      
      // Commandes de base
      if (text === '!ping' || text === '.ping') {
        await sock.sendMessage(jid, { text: '🏓 Pong!' });
      }
      else if (text === '!aide' || text === '.help') {
        await sock.sendMessage(jid, { text: helpMessage });
      }
      else if (text === '!info' || text === '.info') {
        await sock.sendMessage(jid, { text: infoMessage });
      }
      else if (text === '!rmd' || text === '.rmd') {
        await sock.sendMessage(jid, { text: rmdContact });
      }
      else if (text === '!time' || text === '.time') {
        const time = moment().format('HH:mm:ss');
        await sock.sendMessage(jid, { text: `🕐 Heure actuelle: ${time}` });
      }
      else if (text === '!date' || text === '.date') {
        const date = moment().format('DD/MM/YYYY');
        await sock.sendMessage(jid, { text: `📅 Date actuelle: ${date}` });
      }
      else if (text === '!status' || text === '.status') {
        await sock.sendMessage(jid, { text: '✅ Bot en ligne et opérationnel!' });
      }
      
      // Commandes de mention (tag)
      else if ((text === '!tagall' || text === '.tagall') && isGroup) {
        await tagAllMembers(sock, jid);
      }
      else if ((text === '!tagadmin' || text === '.tagadmin') && isGroup) {
        await tagAdmins(sock, jid);
      }
      else if ((text.startsWith('!tag ') || text.startsWith('.tag ')) && isGroup) {
        const messageText = text.substring(5);
        await tagWithMessage(sock, jid, messageText);
      }
      else if ((text === '!everyone' || text === '.everyone') && isGroup) {
        await tagAllMembers(sock, jid);
      }
    }
  });
}

// Fonctions utilitaires
function getMessageText(message) {
  if (message.message.conversation) {
    return message.message.conversation;
  }
  if (message.message.extendedTextMessage && message.message.extendedTextMessage.text) {
    return message.message.extendedTextMessage.text;
  }
  return '';
}

async function tagAllMembers(sock, jid) {
  try {
    const groupMetadata = await sock.groupMetadata(jid);
    const participants = groupMetadata.participants;
    
    let mentionText = '📍 *MENTION DE TOUS LES MEMBRES*\n\n';
    participants.forEach(participant => {
      mentionText += `@${participant.id.split('@')[0]} `;
    });
    
    await sock.sendMessage(jid, { 
      text: mentionText,
      mentions: participants.map(p => p.id)
    });
  } catch (error) {
    console.error('Erreur tagAllMembers:', error);
  }
}

async function tagAdmins(sock, jid) {
  try {
    const groupMetadata = await sock.groupMetadata(jid);
    const admins = groupMetadata.participants.filter(p => p.admin);
    
    let mentionText = '👑 *MENTION DES ADMINISTRATEURS*\n\n';
    admins.forEach(admin => {
      mentionText += `@${admin.id.split('@')[0]} `;
    });
    
    await sock.sendMessage(jid, { 
      text: mentionText,
      mentions: admins.map(a => a.id)
    });
  } catch (error) {
    console.error('Erreur tagAdmins:', error);
  }
}

async function tagWithMessage(sock, jid, messageText) {
  try {
    const groupMetadata = await sock.groupMetadata(jid);
    const participants = groupMetadata.participants;
    
    let mentionText = `📢 ${messageText}\n\n`;
    participants.forEach(participant => {
      mentionText += `@${participant.id.split('@')[0]} `;
    });
    
    await sock.sendMessage(jid, { 
      text: mentionText,
      mentions: participants.map(p => p.id)
    });
  } catch (error) {
    console.error('Erreur tagWithMessage:', error);
  }
}

// Messages d'aide
const helpMessage = `
🤖 *RMD BOT - AIDE*

🔧 *Commandes Principales:*
!aide - Affiche ce message
!ping - Test de connexion
!status - Statut du bot
!info - Informations du bot
!rmd - Contact du créateur
!time - Heure actuelle
!date - Date actuelle

🏷️ *Commandes de Mention:*
!tagall - Mentionne tous les membres
!tagadmin - Mentionne les administrateurs
!tag [texte] - Message avec mention
!everyone - Alternative à tagall

Pour plus d'informations, contactez RMD125.
`;

const infoMessage = `
🤖 *RMD BOT - INFORMATIONS*

*Version:* 4.0.0
*Développeur:* RMD125
*Status:* En ligne et opérationnel
*Node.js:* ${process.version}
*Plateforme:* ${process.platform}

*Fonctionnalités:*
- Messages avec mentions
- Gestion des groupes
- Commandes administrateur
- Sécurité renforcée

*Contact:*
📞 +228 96 19 09 34
📞 +228 96 12 40 78
`;

const rmdContact = `
👑 *CONTACT RMD125*

*Développeur du Bot WhatsApp RMD*

📞 *WhatsApp 1:* +228 96 19 09 34
📞 *WhatsApp 2:* +228 96 12 40 78

💬 *Support:* Réponse sous 24h maximum

🌐 *Services:*
- Développement de bots WhatsApp
- Automatisation WhatsApp
- Solutions personnalisées

_Contactez-moi pour toute question ou service personnalisé._
`;
