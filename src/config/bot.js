const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    token: process.env.TELEGRAM_BOT_TOKEN,
    mode: isProd ? 'webhook' : 'polling',
    webhook: {
        url: `https://mytasks.store/webhook/${process.env.TELEGRAM_BOT_TOKEN}`,
        port: process.env.PORT || 3000,
        certificate: isProd ? process.env.SSL_CERT_PATH : null
    },
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
}; 