const jwt = require('jsonwebtoken');
const TelegramLogin = require('node-telegram-login');
const config = require('../../config/config');
const { User } = require('../../models');

class AuthController {
    static async telegramAuth(req, res) {
        try {
            const validator = new TelegramLogin(config.telegram.token);
            const data = req.body;
            
            if (validator.validate(data)) {
                const [user] = await User.findOrCreate({
                    where: { telegramId: data.id.toString() },
                    defaults: {
                        username: data.username,
                        settings: { notifications: true }
                    }
                });

                const token = jwt.sign({ id: user.id }, config.jwt.secret);
                res.json({ token, user });
            } else {
                res.status(401).json({ error: 'Invalid authentication' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AuthController; 