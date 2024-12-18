const logger = require('./logger');

class ErrorHandler {
    static async handle(error, context = {}) {
        const errorId = Math.random().toString(36).substring(7);
        logger.error(`Error [${errorId}]: ${error.message}`, error);

        const errorResponse = {
            message: 'Произошла ошибка',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorId
        };

        if (context.bot && context.chatId) {
            await context.bot.sendMessage(
                context.chatId,
                `❌ ${errorResponse.message}\nID ошибки: ${errorId}`
            );
        }

        return errorResponse;
    }

    static async handleBotError(bot, chatId, error) {
        return this.handle(error, { bot, chatId });
    }
}

module.exports = ErrorHandler; 