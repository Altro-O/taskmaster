const Project = require('../models/Project');

class ProjectController {
    async createProject(userId, title, description = '', parentId = null) {
        try {
            const project = new Project({
                userId,
                title,
                description,
                parent: parentId
            });
            return await project.save();
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    async getProjectHierarchy(userId) {
        try {
            // Получаем все проекты пользователя
            const projects = await Project.find({ userId })
                .populate('subprojects')
                .sort({ createdAt: -1 });

            // Строим дерево проектов
            const rootProjects = projects.filter(p => !p.parent);
            const projectTree = rootProjects.map(project => 
                this.buildProjectTree(project, projects)
            );

            return projectTree;
        } catch (error) {
            console.error('Error getting project hierarchy:', error);
            throw error;
        }
    }

    buildProjectTree(project, allProjects) {
        const subprojects = allProjects
            .filter(p => p.parent && p.parent.toString() === project._id.toString())
            .map(subproject => this.buildProjectTree(subproject, allProjects));

        return {
            ...project.toObject(),
            subprojects
        };
    }

    async moveProject(projectId, userId, newParentId) {
        try {
            // Проверяем, что новый родитель существует и принадлежит пользователю
            if (newParentId) {
                const parentProject = await Project.findOne({
                    _id: newParentId,
                    userId
                });
                if (!parentProject) {
                    throw new Error('Parent project not found');
                }
            }

            return await Project.findOneAndUpdate(
                { _id: projectId, userId },
                { parent: newParentId },
                { new: true }
            );
        } catch (error) {
            console.error('Error moving project:', error);
            throw error;
        }
    }

    async getProjectPath(projectId, userId) {
        try {
            const path = [];
            let currentProject = await Project.findOne({ _id: projectId, userId });

            while (currentProject) {
                path.unshift(currentProject);
                if (!currentProject.parent) break;
                currentProject = await Project.findOne({
                    _id: currentProject.parent,
                    userId
                });
            }

            return path;
        } catch (error) {
            console.error('Error getting project path:', error);
            throw error;
        }
    }
}

module.exports = new ProjectController(); 