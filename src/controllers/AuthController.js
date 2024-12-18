const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class AuthController {
    async register(userData) {
        try {
            const existingUser = await User.findOne({
                where: { telegramId: userData.telegramId }
            });

            if (existingUser) {
                throw new Error('User already exists');
            }

            const user = await User.create(userData);
            return this.generateToken(user);
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    async login(telegramId, password) {
        try {
            const user = await User.findOne({
                where: { telegramId }
            });

            if (!user) {
                throw new Error('User not found');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('Invalid password');
            }

            return this.generateToken(user);
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }

    generateToken(user) {
        return jwt.sign(
            { id: user.id, telegramId: user.telegramId },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            const user = await User.findOne({
                where: { id: decoded.id }
            });

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            console.error('Error verifying token:', error);
            throw error;
        }
    }
}

module.exports = new AuthController(); 