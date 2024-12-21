const express = require('express');
const router = express.Router();
const AchievementController = require('../../controllers/AchievementController');

router.get('/', async (req, res) => {
    try {
        const achievements = await AchievementController.getUserAchievements(req.user.id);
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get achievements' });
    }
});

router.post('/check', async (req, res) => {
    try {
        await AchievementController.checkAchievements(req.user.id);
        res.json({ message: 'Achievements checked' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check achievements' });
    }
});

module.exports = router; 