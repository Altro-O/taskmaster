const express = require('express');
const router = express.Router();
const User = require('../../models/User');

router.post('/', async (req, res) => {
    try {
        const { type, value } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        switch (type) {
            case 'notifications':
                user.settings.notifications = value;
                break;
            case 'theme':
                user.settings.theme = value ? 'dark' : 'light';
                break;
            case 'reportTime':
                user.settings.reportTime = value;
                break;
        }

        await user.save();
        res.json({ message: 'Settings updated' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router; 