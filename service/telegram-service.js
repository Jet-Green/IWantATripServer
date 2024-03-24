const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_API_TOKEN
const chat_id = process.env.TELEGRAM_CHAT_ID

let bot;

if (process.argv[2] == 'production') {
    bot = new TelegramBot(token, { polling: true })
}

// экспортирую объект с пустыми функциями, если если мод development
module.exports = process.argv[2] == 'production' ? {
    async sendPost(html) {
        try {
            await bot.sendMessage(
                chat_id, html, {
                    parse_mode: 'HTML'
                }
            )
        } catch (error) {
            console.error(error)
        }
    }
} : { async sendPost(html) { return } }