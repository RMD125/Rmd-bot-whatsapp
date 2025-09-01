# 🤖 RMD Bot - WhatsApp Bot

Bot WhatsApp Premium développé par **RMD125** avec des fonctionnalités avancées et une sécurité renforcée.

## ✨ Fonctionnalités Exclusives

### 🔧 Commandes Principales
- `!aide` - Affiche l'aide complète
- `!info` - Informations du bot
- `!rmd` - Contact du créateur
- `!status` - Statut du bot
- `!ping` - Test de connexion
- `!time` - Heure actuelle
- `!date` - Date actuelle

### 🏷️ Commandes de Mention (Tag)
- `!tagall` - Mentionne tous les membres du groupe
- `!tagadmin` - Mentionne les administrateurs du groupe
- `!tag [texte]` - Crée un message avec mention personnalisée
- `!everyone` - Alternative à tagall

### 👑 Commandes Admin
- `!admin add [numero]` - Ajouter un utilisateur
- `!admin list` - Lister les administrateurs

## 🔒 Sécurité Renforcée
- ✅ Accès strictement réservé aux numéros autorisés
- ✅ Commandes sensibles limitées aux administrateurs
- ✅ Protection contre le clonage
- ✅ Journalisation complète des activités

## 🚀 Déploiement

### Sur Render.com
1. Créer un compte sur [Render.com](https://render.com)
2. Connecter le compte GitHub
3. Créer un nouveau "Web Service"
4. Sélectionner ce dépôt
5. Configurer avec:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

### Configuration Requise
```yaml
Node.js: 20.x
Dependencies: 
  "@whiskeysockets/baileys": "6.5.1",
  "qrcode-terminal": "^0.12.0",
  "express": "^4.18.2"
