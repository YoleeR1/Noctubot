# NoctuBot

<div align="center">
  <img src="https://img.shields.io/badge/discord.js-v14-blue.svg" alt="discord.js">
  <img src="https://img.shields.io/badge/node-16.x-green.svg" alt="node.js">
  <img src="https://img.shields.io/badge/license-MIT-orange.svg" alt="license">
</div>

Welcome to NoctuBot's GitHub repository! NoctuBot is a powerful, feature-rich Discord bot originally designed for the Nocturnals community. With extensive moderation tools, a robust economy system, fun games, and much more, NoctuBot aims to enhance your Discord server experience.

## 🌟 Features

NoctuBot comes packed with a wide range of features organized into various categories:

### 🛡️ Moderation
- **Complete Moderation Suite**: Ban, kick, timeout, warn, and more
- **Warning System**: Track and manage user warnings
- **Auto-Moderation**: Anti-spam, anti-invite, and link filtering
- **Customizable Mod Roles**: Set up moderator, trial mod, and baby mod roles

### 💰 Economy
- **Comprehensive Economy System**: Work, beg, crime, fish, hunt, and more
- **Store System**: Buy and sell items
- **Banking**: Deposit and withdraw money
- **Gambling**: Various casino games like blackjack, slots, and roulette

### 🎮 Fun & Games
- **Interactive Games**: Trivia, RPS, snake, fast type, and more
- **Fun Commands**: Memes, GIFs, roasts, and other entertainment
- **Image Manipulation**: Various image effects and generators

### 🎁 Giveaways
- **Robust Giveaway System**: Host giveaways with memory in case of bot crashes
- **Customizable Options**: Set duration, winners, and prizes
- **Management Commands**: Edit, end, reroll, pause, and unpause giveaways

### 🎫 Tickets
- **Ticket System**: Create and manage support tickets
- **Customizable**: Set up ticket panels and messages
- **Transcripts**: Save ticket conversations

### 📊 Levels & XP
- **Leveling System**: Track user activity with XP and levels
- **Rewards**: Set up level-based role rewards
- **Leaderboards**: View top users by level or messages

### ⚙️ Customization
- **Custom Commands**: Create your own commands
- **Reaction Roles**: Set up role assignment via reactions
- **Welcome & Leave Messages**: Customize messages and channels
- **Server Stats**: Dynamic channel names showing server statistics

### 🔍 Utility
- **Search Tools**: Weather, YouTube, Google, and more
- **Tools**: Calculator, QR code generator, reminders, and more
- **Information Commands**: User info, server info, and more

## 📋 Prerequisites

Before installing NoctuBot, make sure you have:

- Node.js 16.x or higher
- npm (comes with Node.js)
- MongoDB database
- A Discord bot token (create one at [Discord Developer Portal](https://discord.com/developers/applications))

## 🚀 Installation

This guide works for both Linux (Debian-based) and Windows systems.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YoleeR12/Noctubot.git
   cd Noctubot
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and fill in the required values:
   - `TOKEN`: Your Discord bot token
   - `MONGO_TOKEN`: Your MongoDB connection string
   - Other required API keys as needed

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the bot**:
   ```bash
   node src/index.js
   ```
   
   Alternatively, you can use the provided start scripts:
   - For Linux: `bash start.sh`
   - For Windows: `start.bat`

### 🔄 Running 24/7 with PM2

To keep the bot running 24/7 and start it automatically on reboot, use **PM2**:

1. **Install PM2 globally**:
   ```bash
   npm install pm2 -g
   ```

2. **Start the bot with PM2**:
   ```bash
   pm2 start src/index.js --name NoctuBot
   ```

3. **Set PM2 to start on boot**:
   ```bash
   pm2 startup
   pm2 save
   ```

## 🔧 Configuration

NoctuBot offers extensive configuration options through Discord commands:

- Use `/setup` commands to configure various bot features
- Set up mod roles with `/setup moderatorrole`, `/setup trialmodrole`, and `/setup babymodrole`
- Configure warning channels with `/setup warningschannel`
- And many more setup commands for different features

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please ensure your code is well-tested and follows the existing code style.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Note

This bot was originally intended for private use by the Nocturnals community. It will continue to be updated to fit Nocturnals needs while also including updates for general users.
