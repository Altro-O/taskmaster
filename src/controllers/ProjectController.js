const { Project, Task, User } = require('../models');
const { Op } = require('sequelize');

class ProjectController {
    async createProject(userId, title, description = '', parentId = null) {
        try {
            const project = await Project.create({
                title,
                description,
                parent: parentId,
                UserId: userId
            });

            return project;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    async getUserProjects(userId) {
        try {
            return await Project.findAll({
                where: { UserId: userId },
                include: [
                    {
                        model: Task,
                        attributes: ['id', 'status']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            console.error('Error getting projects:', error);
            throw error;
        }
    }

    async getProjectHierarchy(userId) {
        try {
            // Получаем все проекты пользователя
            const projects = await Project.findAll({
                where: { 
                    UserId: userId,
                    parent: null // Только корневые проекты
                },
                include: [
                    {
                        model: Project,
                        as: 'subprojects',
                        include: [{ model: Task }]
                    },
                    { model: Task }
                ],
                order: [['createdAt', 'DESC']]
            });

            return projects;
        } catch (error) {
            console.error('Error getting project hierarchy:', error);
            throw error;
        }
    }

    async moveProject(projectId, userId, newParentId) {
        try {
            if (newParentId) {
                const parentProject = await Project.findOne({
                    where: { 
                        id: newParentId,
                        UserId: userId
                    }
                });

                if (!parentProject) {
                    throw new Error('Parent project not found');
                }
            }

            const [updated] = await Project.update(
                { parent: newParentId },
                { 
                    where: { id: projectId, UserId: userId },
                    returning: true
                }
            );

            if (!updated) throw new Error('Project not found');

            return await Project.findOne({
                where: { id: projectId, UserId: userId },
                include: [
                    {
                        model: Project,
                        as: 'subprojects',
                        include: [{ model: Task }]
                    },
                    { model: Task }
                ]
            });
        } catch (error) {
            console.error('Error moving project:', error);
            throw error;
        }
    }

    async getProjectPath(projectId, userId) {
        try {
            const path = [];
            let currentProject = await Project.findOne({
                where: { id: projectId, UserId: userId }
            });

            while (currentProject) {
                path.unshift(currentProject);
                if (!currentProject.parent) break;
                
                currentProject = await Project.findOne({
                    where: { 
                        id: currentProject.parent,
                        UserId: userId
                    }
                });
            }

            return path;
        } catch (error) {
            console.error('Error getting project path:', error);
            throw error;
        }
    }

    async deleteProject(projectId, userId) {
        try {
            // Удаляем все задачи проекта
            await Task.destroy({
                where: { ProjectId: projectId }
            });

            // Удаляем сам проект
            const result = await Project.destroy({
                where: { id: projectId, UserId: userId }
            });

            return result > 0;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }
}

module.exports = new ProjectController(); 