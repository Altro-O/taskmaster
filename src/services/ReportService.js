const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const PDFDocument = require('pdfkit');
const xl = require('excel4node');
const fs = require('fs');
const path = require('path');

class ReportService {
    constructor() {
        this.chartJSNodeCanvas = new ChartJSNodeCanvas({
            width: 800,
            height: 400,
            backgroundColour: 'white'
        });
    }

    async generateTasksChart(tasksData) {
        try {
            const configuration = {
                type: 'bar',
                data: {
                    labels: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
                    datasets: [{
                        label: 'Задачи по статусам',
                        data: [
                            tasksData.byStatus.TODO,
                            tasksData.byStatus.IN_PROGRESS,
                            tasksData.byStatus.IN_REVIEW,
                            tasksData.byStatus.DONE
                        ],
                        backgroundColor: [
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(153, 102, 255, 0.5)',
                            'rgba(75, 192, 192, 0.5)'
                        ]
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            };

            const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
            const filePath = path.join(__dirname, '../../temp', `tasks_chart_${Date.now()}.png`);
            fs.writeFileSync(filePath, imageBuffer);
            return filePath;
        } catch (error) {
            console.error('Error generating tasks chart:', error);
            throw error;
        }
    }

    async generatePDFReport(data) {
        const doc = new PDFDocument();
        
        doc.fontSize(20).text('Отчет по задачам', { align: 'center' });
        doc.moveDown();
        
        // Статистика
        doc.fontSize(14).text(`Всего задач: ${data.total}`);
        doc.text(`Выполнено: ${data.completed}`);
        
        return doc;
    }

    async generateExcelReport(data) {
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet('Report');
        
        // Заголовки
        ws.cell(1, 1).string('Задача');
        ws.cell(1, 2).string('Статус');
        ws.cell(1, 3).string('Приоритет');
        ws.cell(1, 4).string('Дедлайн');

        // Данные
        data.tasks.forEach((task, index) => {
            const row = index + 2;
            ws.cell(row, 1).string(task.title);
            ws.cell(row, 2).string(task.status);
            ws.cell(row, 3).string(task.priority);
            ws.cell(row, 4).string(task.deadline ? new Date(task.deadline).toLocaleDateString() : '');
        });

        return wb;
    }
}

const reportService = new ReportService();

module.exports = ReportService; 