window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

async function loadTasks() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tasks = await response.json();
        if (!Array.isArray(tasks)) {
            throw new Error('Tasks data is not an array');
        }
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

function createTask() {
    const modal = document.getElementById('createTaskModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    modal.style.display = 'block';
}

async function submitTask(event) {
    event.preventDefault();
    const form = event.target;
    const title = form.title.value;
    const priority = form.priority.value;
    const deadline = form.deadline.value;

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, priority, deadline })
        });

        if (response.ok) {
            document.getElementById('createTaskModal').style.display = 'none';
            loadTasks(); // Перезагружаем список задач
        }
    } catch (error) {
        console.error('Error creating task:', error);
    }
}

async function updateTaskStatus(taskId, status) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadTasks(); // Перезагружаем список задач
        }
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function editTask(taskId) {
    try {
        // Получаем данные задачи
        const response = await fetch(`/api/tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const task = await response.json();

        // Заполняем форму
        const modal = document.getElementById('createTaskModal');
        const form = modal.querySelector('form');
        form.title.value = task.title;
        form.priority.value = task.priority;
        if (task.deadline) {
            form.deadline.value = new Date(task.deadline).toISOString().slice(0, 16);
        }

        // Меняем обработчик формы
        form.onsubmit = (e) => submitEditTask(e, taskId);
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error editing task:', error);
    }
}

async function submitEditTask(event, taskId) {
    event.preventDefault();
    const form = event.target;
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                title: form.title.value,
                priority: form.priority.value,
                deadline: form.deadline.value
            })
        });

        if (response.ok) {
            document.getElementById('createTaskModal').style.display = 'none';
            loadTasks();
        }
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTask(taskId) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                loadTasks();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }
}

function showSettings() {
    document.getElementById('settingsModal').style.display = 'block';
}

async function updateSettings(type) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type,
                value: document.getElementById(`${type}Toggle`).checked
            })
        });

        if (response.ok) {
            // Применяем настройки
            applySettings();
        }
    } catch (error) {
        console.error('Error updating settings:', error);
    }
}

function applySettings() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.className = `theme-${theme}`;
    
    // Загружаем сохраненные настройки
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    document.getElementById('notificationsToggle').checked = settings.notifications;
    document.getElementById('themeToggle').checked = theme === 'dark';
    document.getElementById('reportTime').value = settings.reportTime || '09:00';
}
