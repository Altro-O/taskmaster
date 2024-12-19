const { Project, Task } = require('../models');

class ProjectService {
    static async createProject(userId, data) {
        try {
            const project = await Project.create({
                ...data,
                UserId: userId
            });
            return project;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    static async getProjects(userId) {
        try {
            const projects = await Project.findAll({
                where: { UserId: userId },
                include: [{ model: Task }],
                order: [['createdAt', 'DESC']]
            });
            return projects;
        } catch (error) {
            console.error('Error getting projects:', error);
            throw error;
        }
    }

    static async updateProject(projectId, data) {
        try {
            const [updated] = await Project.update(data, {
                where: { id: projectId },
                returning: true
            });

            if (!updated) throw new Error('Project not found');

            return await Project.findByPk(projectId);
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    }

    static async deleteProject(projectId) {
        try {
            const project = await Project.findByPk(projectId);
            if (!project) throw new Error('Project not found');

            await project.destroy();
            return { message: 'Project deleted successfully' };
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }
}

module.exports = ProjectService; 