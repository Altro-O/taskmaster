class Charts {
    constructor(container) {
        this.container = container;
    }

    async renderTasksChart(data) {
        const ctx = document.createElement('canvas');
        this.container.appendChild(ctx);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['TODO', 'IN_PROGRESS', 'DONE'],
                datasets: [{
                    label: 'Задачи',
                    data: [data.todo, data.inProgress, data.completed],
                    backgroundColor: [
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(75, 192, 192, 0.5)'
                    ]
                }]
            }
        });
    }

    async renderProductivityChart(data) {
        const ctx = document.createElement('canvas');
        this.container.appendChild(ctx);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [{
                    label: 'Продуктивность',
                    data: data.productivity,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

export default Charts; 