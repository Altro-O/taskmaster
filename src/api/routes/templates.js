const express = require('express');
const router = express.Router();
const TemplateController = require('../../controllers/TemplateController');

router.get('/', async (req, res) => {
    try {
        const templates = await TemplateController.getUserTemplates(req.userId);
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении шаблонов' });
    }
});

module.exports = router; 