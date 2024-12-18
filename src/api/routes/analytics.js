const express = require('express');
const router = express.Router();
const AnalyticsService = require('../../services/AnalyticsService');

router.get('/stats', async (req, res) => {
    try {
        const stats = await AnalyticsService.getTasksStats(req.userId);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении статистики' });
    }
});

module.exports = router; 