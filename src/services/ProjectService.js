const { Project, Task } = require('../models');

class ProjectService {
    static async getProjects(userId) {
        return await Project.findAll({
            where: { UserId: userId },
            include: [Task],
            order: [['createdAt', 'DESC']]
        });
    }

    static async createProject(userId, data) {
        return await Project.create({
            ...data,
            UserId: userId
        });
    }

    static async updateProject(projectId, userId, data) {
        const project = await Project.findOne({
            where: { id: projectId, UserId: userId }
        });
        if (!project) throw new Error('Project not found');
        return await project.update(data);
    }

    static async deleteProject(projectId, userId) {
        const project = await Project.findOne({
            where: { id: projectId, UserId: userId }
        });
        if (!project) throw new Error('Project not found');
        await project.destroy();
    }
}

module.exports = ProjectService; 