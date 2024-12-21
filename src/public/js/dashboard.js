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
        // Загружаем задачи
        const tasksResponse = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await tasksResponse.json();
        
        // Загружаем статистику
        const statsResponse = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsResponse.json();
        
        updateDashboard(tasks, stats);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateDashboard(tasks, stats) {
    // Обновляем статистику
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('completedTasks').textContent = stats.completed;
    
    // Обновляем списки задач
    const todayTasks = tasks.filter(task => isToday(task.deadline));
    const urgentTasks = tasks.filter(task => task.priority === 'HIGH');
    
    renderTaskList('todayTasks', todayTasks);
    renderTaskList('urgentTasks', urgentTasks);
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