document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboard();
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

function showDonateModal() {
    const modal = document.getElementById('donateModal');
    modal.style.display = 'block';
}

async function loadDashboard() {
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
        renderDashboard(tasks);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderDashboard(tasks) {
    const todayTasks = document.getElementById('todayTasks');
    const urgentTasks = document.getElementById('urgentTasks');
    if (!todayTasks || !urgentTasks) return;

    // Фильтруем задачи
    const today = new Date();
    const todaysList = tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        return taskDate.toDateString() === today.toDateString();
    });

    const urgentList = tasks.filter(task => 
        task.priority === 'HIGH' && task.status !== 'DONE'
    );

    // Рендерим задачи
    todayTasks.innerHTML = renderTaskList(todaysList);
    urgentTasks.innerHTML = renderTaskList(urgentList);
}

document.addEventListener('DOMContentLoaded', loadDashboard); 

// Добавить функции для работы с шаблонами
async function loadTemplates() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/templates', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const templates = await response.json();
        renderTemplates(templates);
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

// Добавить функции для работы с достижениями
async function loadAchievements() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/achievements', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const achievements = await response.json();
        renderAchievements(achievements);
    } catch (error) {
        console.error('Error loading achievements:', error);
    }
} 