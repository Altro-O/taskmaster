document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProjects();
}); 

async function loadProjects() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const projects = await response.json();
        renderProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = projects.map(project => `
        <div class="project-card">
            <h3>${project.title}</h3>
            <p>${project.description || ''}</p>
            <div class="project-stats">
                <span>Задачи: ${project.Tasks ? project.Tasks.length : 0}</span>
            </div>
        </div>
    `).join('');
} 