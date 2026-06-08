/**
 * SKIN CANCER CLASSIFICATION WEBSITE
 * Dashboard Charts Config (Using Chart.js)
 */

const DashboardCharts = {
  charts: {},

  initDiseaseDistribution(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Destroy existing if any
    if (this.charts[canvasId]) this.charts[canvasId].destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#9CA3AF' : '#6B7280';

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Melanoma', 'Melanocytic Nevus', 'Basal Cell Carcinoma', 'Actinic Keratosis', 'Benign Keratosis', 'Dermatofibroma', 'Vascular Lesion'],
        datasets: [{
          data: [12, 35, 18, 8, 15, 6, 6],
          backgroundColor: [
            '#EF5350', // Red
            '#43A047', // Green
            '#FF9800', // Orange
            '#FFC107', // Amber
            '#26A69A', // Teal
            '#1E88E5', // Blue
            '#AB47BC'  // Purple
          ],
          borderWidth: isDark ? 2 : 1,
          borderColor: isDark ? '#111827' : '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 11 }
            }
          }
        }
      }
    });
  },

  initAccuracyModelComparison(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) this.charts[canvasId].destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1F2937' : '#E5E7EB';
    const textColor = isDark ? '#9CA3AF' : '#6B7280';

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['ResNet50', 'EfficientNet-B4', 'DenseNet-121', 'Ensemble Model'],
        datasets: [
          {
            label: 'Accuracy (%)',
            data: [91.2, 93.8, 92.5, 94.5],
            backgroundColor: 'rgba(21, 101, 192, 0.85)',
            borderRadius: 6
          },
          {
            label: 'Sensitivity (%)',
            data: [89.4, 91.8, 90.6, 93.2],
            backgroundColor: 'rgba(38, 166, 154, 0.85)',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 11 }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Inter' } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Inter' } },
            min: 80,
            max: 100
          }
        }
      }
    });
  },

  initMonthlyTrend(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) this.charts[canvasId].destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1F2937' : '#E5E7EB';
    const textColor = isDark ? '#9CA3AF' : '#6B7280';

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Total Scans',
          data: [65, 82, 110, 95, 140, 185],
          borderColor: '#1565C0',
          backgroundColor: 'rgba(21, 101, 192, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Inter' } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Inter' } }
          }
        }
      }
    });
  }
};
