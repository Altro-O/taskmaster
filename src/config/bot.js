const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    token: process.env.TELEGRAM_BOT_TOKEN,
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
}; 