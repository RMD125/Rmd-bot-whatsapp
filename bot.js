const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration Express pour Render
app.get('/', (req, res) => {
  res.send('🤖 RMD Bot est en ligne!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectToWhatsApp();
});

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: require('pino')({ level: 'silent' })
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Scannez le QR code ci-dessus pour vous connecter');
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('Connecté avec succès!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
  
  // Gestion des messages
  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];
    if (!message.key.fromMe && m.type === 'notify') {
      await sock.readMessages([message.key]);
      
      const text = message.message.conversation || 
                  (message.message.extendedTextMessage && message.message.extendedTextMessage.text) || 
                  '';
      
      const jid = message.key.remoteJid;
      const isGroup = jid.endsWith('@g.us');
      
      // Commandes de base
      if (text === '!ping') {
        await sock.sendMessage(jid, { text: 'Pong!' });
      }
      else if (text === '!aide' || text === '!help') {
        await sock.sendMessage(jid, { text: helpMessage });
      }
      
      // Commandes de mention (tag)
      else if (text === '!tagall' && isGroup) {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        
        let mentionText = '';
        participants.forEach(participant => {
          mentionText += `@${participant.id.split('@')[0]} `;
        });
        
        await sock.sendMessage(jid, { 
          text: mentionText,
          mentions: participants.map(p => p.id)
        });
      }
      else if (text === '!tagadmin' && isGroup) {
        const groupMetadata = await sock.groupMetadata(jid);
        const admins = groupMetadata.participants.filter(p => p.admin);
        
        let mentionText = 'Administrateurs: ';
        admins.forEach(admin => {
          mentionText += `@${admin.id.split('@')[0]} `;
        });
        
        await sock.sendMessage(jid, { 
          text: mentionText,
          mentions: admins.map(a => a.id)
        });
      }
      else if (text.startsWith('!tag ') && isGroup) {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        const messageText = text.substring(5);
        
        let mentionText = messageText + '\n';
        participants.forEach(participant => {
          mentionText += `@${participant.id.split('@')[0]} `;
        });
        
        await sock.sendMessage(jid, { 
          text: mentionText,
          mentions: participants.map(p => p.id)
        });
      }
    }
  });
}

const helpMessage = `
🤖 *RMD BOT - AIDE*

🔧 *Commandes Principales:*
!aide - Affiche ce message
!ping - Test de connexion
!status - Statut du bot
!info - Informations du bot
!rmd - Contact du créateur

🏷️ *Commandes de Mention:*
!tagall - Mentionne tous les membres
!tagadmin - Mentionne les administrateurs
!tag [texte] - Message avec mention
!everyone - Alternative à tagall

👑 *Commandes Admin:*
!admin add [numero] - Ajouter un utilisateur
!admin remove [numero] - Retirer un utilisateur
!admin list - Lister les utilisateurs

Pour plus d'informations, contactez RMD125.
`;
