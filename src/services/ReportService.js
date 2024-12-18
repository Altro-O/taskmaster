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

    async generatePDFReport(tasksData, projectsData, productivityData) {
        try {
            const doc = new PDFDocument();
            const filePath = path.join(__dirname, '../../temp', `report_${Date.now()}.pdf`);
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // Заголовок
            doc.fontSize(20).text('TaskMaster - Отчет', { align: 'center' });
            doc.moveDown();

            // Общая статистика
            doc.fontSize(16).text('Общая статистика по задачам:');
            doc.fontSize(12)
                .text(`Всего задач: ${tasksData.total}`)
                .text(`Выполнено: ${tasksData.byStatus.DONE}`)
                .text(`Процент выполнения: ${tasksData.completionRate}%`)
                .text(`Просроченные задачи: ${tasksData.overdue}`);
            doc.moveDown();

            // Статистика по проектам
            doc.fontSize(16).text('Статистика по проектам:');
            projectsData.forEach(project => {
                doc.fontSize(12)
                    .text(`${project.name}:`)
                    .text(`  Всего задач: ${project.total}`)
                    .text(`  Выполнено: ${project.completed}`)
                    .text(`  В процессе: ${project.inProgress}`);
            });
            doc.moveDown();

            // Продуктивность
            doc.fontSize(16).text('Продуктивность за последние 7 дней:');
            productivityData.forEach(day => {
                doc.fontSize(12)
                    .text(`${day.date}:`)
                    .text(`  Создано задач: ${day.created}`)
                    .text(`  Выполнено задач: ${day.completed}`);
            });

            doc.end();
            return filePath;
        } catch (error) {
            console.error('Error generating PDF report:', error);
            throw error;
        }
    }

    async generateExcelReport(tasksData, projectsData, productivityData) {
        try {
            const wb = new xl.Workbook();
            const filePath = path.join(__dirname, '../../temp', `report_${Date.now()}.xlsx`);

            // Лист с общей статистикой
            const tasksSheet = wb.addWorksheet('Задачи');
            tasksSheet.cell(1, 1).string('Статус');
            tasksSheet.cell(1, 2).string('Количество');
            
            let row = 2;
            Object.entries(tasksData.byStatus).forEach(([status, count]) => {
                tasksSheet.cell(row, 1).string(status);
                tasksSheet.cell(row, 2).number(count);
                row++;
            });

            // Лист с проектами
            const projectsSheet = wb.addWorksheet('Проекты');
            projectsSheet.cell(1, 1).string('Проект');
            projectsSheet.cell(1, 2).string('Всего задач');
            projectsSheet.cell(1, 3).string('Выполнено');
            projectsSheet.cell(1, 4).string('В процессе');

            projectsData.forEach((project, index) => {
                const row = index + 2;
                projectsSheet.cell(row, 1).string(project.name);
                projectsSheet.cell(row, 2).number(project.total);
                projectsSheet.cell(row, 3).number(project.completed);
                projectsSheet.cell(row, 4).number(project.inProgress);
            });

            // Лист с продуктивностью
            const productivitySheet = wb.addWorksheet('Продуктивность');
            productivitySheet.cell(1, 1).string('Дата');
            productivitySheet.cell(1, 2).string('Создано');
            productivitySheet.cell(1, 3).string('Выполнено');

            productivityData.forEach((day, index) => {
                const row = index + 2;
                productivitySheet.cell(row, 1).string(day.date);
                productivitySheet.cell(row, 2).number(day.created);
                productivitySheet.cell(row, 3).number(day.completed);
            });

            await wb.write(filePath);
            return filePath;
        } catch (error) {
            console.error('Error generating Excel report:', error);
            throw error;
        }
    }
}

module.exports = ReportService; 