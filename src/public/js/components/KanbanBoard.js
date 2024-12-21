class KanbanBoard {
    constructor() {
        this.columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
        this.init();
    }

    async loadTasks() {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await response.json();
        this.renderTasks(tasks);
    }

    renderTasks(tasks) {
        this.columns.forEach(column => {
            const columnEl = document.getElementById(column.toLowerCase());
            columnEl.innerHTML = '';
            
            const columnTasks = tasks.filter(t => t.status === column);
            columnTasks.forEach(task => {
                columnEl.appendChild(this.createTaskCard(task));
            });
        });
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
    }

    handleDrop(e) {
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = e.target.id;
        this.updateTaskStatus(taskId, newStatus);
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