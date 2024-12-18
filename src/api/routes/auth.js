const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config/config');
const User = require('../../models/User');

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { email, password, telegramId } = req.body;

        // Проверяем существование пользователя
        const existingUser = await User.findOne({ 
            $or: [{ email }, { telegramId }] 
        });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'Пользователь уже существует' 
            });
        }

        // Создаем нового пользователя
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
            telegramId
        });
        await user.save();

        // Генерируем токен
        const token = jwt.sign(
            { userId: user._id }, 
            config.jwt.secret, 
            { expiresIn: config.jwt.expiresIn }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                telegramId: user.telegramId
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при регистрации' });
    }
});

// Вход
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Ищем пользователя
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                message: 'Неверный email или пароль' 
            });
        }

        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                message: 'Неверный email или пароль' 
            });
        }

        // Генерируем токен
        const token = jwt.sign(
            { userId: user._id }, 
            config.jwt.secret, 
            { expiresIn: config.jwt.expiresIn }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                telegramId: user.telegramId
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при входе' });
    }
});

// Связывание с Telegram
router.post('/link-telegram', authMiddleware, async (req, res) => {
    try {
        const { telegramId } = req.body;
        const userId = req.userId;

        const user = await User.findByIdAndUpdate(
            userId,
            { telegramId },
            { new: true }
        );

        res.json({
            user: {
                id: user._id,
                email: user.email,
                telegramId: user.telegramId
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при связывании с Telegram' });
    }
});

module.exports = router; 