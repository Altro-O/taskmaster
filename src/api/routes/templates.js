const express = require('express');
const router = express.Router();
const TemplateController = require('../../controllers/TemplateController');

router.get('/', async (req, res) => {
    try {
        const templates = await TemplateController.getUserTemplates(req.user.id);
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get templates' });
    }
});

// ... другие методы для работы с шаблонами

module.exports = router; 