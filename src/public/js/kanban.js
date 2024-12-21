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
    }

    setupDragAndDrop(column) {
        column.addEventListener('dragstart', this.handleDragStart.bind(this));
        column.addEventListener('dragover', this.handleDragOver.bind(this));
        column.addEventListener('drop', this.handleDrop.bind(this));
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
} 