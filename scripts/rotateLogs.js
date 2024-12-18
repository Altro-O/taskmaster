const fs = require('fs');
const path = require('path');
const config = require('../src/config/config');

const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5;

function rotateLog(logFile) {
    const stats = fs.statSync(logFile);
    if (stats.size >= MAX_LOG_SIZE) {
        for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
            const oldFile = `${logFile}.${i}`;
            const newFile = `${logFile}.${i + 1}`;
            if (fs.existsSync(oldFile)) {
                fs.renameSync(oldFile, newFile);
            }
        }
        fs.renameSync(logFile, `${logFile}.1`);
        fs.writeFileSync(logFile, '');
    }
}

const logDir = config.logging.dir;
const logLevels = ['debug', 'info', 'warn', 'error'];

logLevels.forEach(level => {
    const logFile = path.join(logDir, `${level}.log`);
    if (fs.existsSync(logFile)) {
        rotateLog(logFile);
    }
}); 