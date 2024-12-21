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