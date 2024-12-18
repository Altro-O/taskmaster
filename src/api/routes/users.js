const express = require('express');
const router = express.Router();
const User = require('../../models/User');

router.get('/me', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении данных пользователя' });
    }
});

module.exports = router; 