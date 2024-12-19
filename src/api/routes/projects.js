const express = require('express');
const router = express.Router();
const ProjectService = require('../../services/ProjectService');

router.get('/', async (req, res) => {
    try {
        const projects = await ProjectService.getProjects(req.user.id);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get projects' });
    }
});

router.post('/', async (req, res) => {
    try {
        const project = await ProjectService.createProject(req.user.id, req.body);
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

module.exports = router; 