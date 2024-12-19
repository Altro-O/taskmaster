async function loadTasks() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function renderTasks(tasks) {
    const grid = document.getElementById('tasksGrid');
    grid.innerHTML = tasks.map(task => `
        <div class="task-card ${task.status.toLowerCase()}">
            <h3>${task.title}</h3>
            <p>${task.description || ''}</p>
            <div class="task-meta">
                <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
                ${task.deadline ? `<span class="deadline">⏰ ${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
            </div>
            <div class="task-actions">
                <button onclick="updateTaskStatus('${task.id}', 'DONE')">✅</button>
                <button onclick="editTask('${task.id}')">✏️</button>
                <button onclick="deleteTask('${task.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadTasks();
});
