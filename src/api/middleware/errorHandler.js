module.exports = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Ошибка валидации',
            errors: err.errors
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            message: 'Требуется авторизация'
        });
    }

    res.status(500).json({
        message: 'Внутренняя ошибка сервера'
    });
}; 