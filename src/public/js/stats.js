async function loadStats() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await response.json();
        renderStats(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderStats(stats) {
    document.getElementById('statsOverview').innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h4>Total Tasks</h4>
                <span class="stat-value">${stats.total}</span>
            </div>
            <div class="stat-card">
                <h4>Completed</h4>
                <span class="stat-value">${stats.completed}</span>
            </div>
            <div class="stat-card">
                <h4>Completion Rate</h4>
                <span class="stat-value">${stats.completionRate}%</span>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadStats);
