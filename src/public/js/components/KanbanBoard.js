class KanbanBoard {
    constructor() {
        this.columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
        this.init();
    }

    init() {
        this.columns.forEach(column => {
            const columnEl = document.getElementById(column.toLowerCase());
            this.setupDragAndDrop(columnEl);
        });
        this.loadTasks();
    }

    setupDragAndDrop(column) {
        column.addEventListener('dragstart', this.handleDragStart.bind(this));
        column.addEventListener('dragover', this.handleDragOver.bind(this));
        column.addEventListener('drop', this.handleDrop.bind(this));
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    async handleDrop(e) {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = e.target.closest('.kanban-column').id.toUpperCase();

        try {
            await this.updateTaskStatus(taskId, newStatus);
            await this.loadTasks();
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.id = task.id;
        card.draggable = true;
        card.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || ''}</p>
            <div class="task-meta">
                <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
                ${task.deadline ? `<span class="deadline">⏰ ${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
            </div>
        `;
        return card;
    }
} 