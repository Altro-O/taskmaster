const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class Logger {
    constructor() {
        this.logsDir = config.logging.dir;
        this.level = config.logging.level;
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };

        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir);
        }
    }

    shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }

    log(level, message, error = null) {
        if (!this.shouldLog(level)) return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...(error && { 
                error: {
                    message: error.message,
                    stack: error.stack
                }
            })
        };

        const logFile = path.join(this.logsDir, `${level}.log`);
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${timestamp}] ${level}: ${message}`);
            if (error) console.error(error);
        }
    }

    info(message) {
        this.log('INFO', message);
    }

    error(message, error) {
        this.log('ERROR', message, error);
    }

    warn(message) {
        this.log('WARN', message);
    }

    debug(message) {
        if (process.env.NODE_ENV !== 'production') {
            this.log('DEBUG', message);
        }
    }
}

module.exports = new Logger(); 