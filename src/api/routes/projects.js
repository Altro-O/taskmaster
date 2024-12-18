const express = require('express');
const router = express.Router();
const ProjectController = require('../../controllers/ProjectController');

router.get('/', async (req, res) => {
    try {
        const projects = await ProjectController.getUserProjects(req.userId);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении проектов' });
    }
});

module.exports = router; 