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
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projects = await response.json();
        renderProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    grid.innerHTML = projects.map(project => `
        <div class="project-card">
            <h3>${project.title}</h3>
            <p>${project.description || ''}</p>
            <div class="project-meta">
                <span class="status ${project.status.toLowerCase()}">${project.status}</span>
                ${project.deadline ? `<span class="deadline">⏰ ${new Date(project.deadline).toLocaleDateString()}</span>` : ''}
            </div>
            <div class="project-actions">
                <button onclick="editProject('${project.id}')">✏️</button>
                <button onclick="deleteProject('${project.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function createProject() {
    const modal = document.getElementById('createProjectModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    modal.style.display = 'block';
} 