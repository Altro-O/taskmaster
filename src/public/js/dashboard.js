const getTasks = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
};

// Обновление UI
const updateDashboard = async () => {
    const tasks = await getTasks();
    // Отображение задач
}; 