<template>
  <div class="chart-container">
    <div class="chart-wrapper">
      <Chart
        v-if="ratingData.length"
        type="line"
        :data="chartData"
        :options="chartOptions"
      />
      <div v-if="isLoading" class="spinner-container">
        <div class="spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type DataPoint } from '@/stores/player';
import { Chart as ChartJS, Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement, TimeScale, TimeSeriesScale} from 'chart.js';
import { Chart } from 'vue-chartjs';
import 'chartjs-adapter-date-fns'

ChartJS.register(Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement, TimeScale, TimeSeriesScale);

const props = defineProps<{
  ratingData: DataPoint[];
  globalTopPositionData: DataPoint[];
  actualTopPositionData: DataPoint[];
  isLoading: boolean;
}>();

// Данные для графика позиций
const chartData = computed(() => {
  return {
    datasets: [
      {
        label: `Позиция в ТОПе`,
        yAxisID: "yPosition",
        data: props.actualTopPositionData.map((point) => ({x: point.date, y: point.value})),
        borderColor: '#806e0a',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: `Позиция в глобальном ТОПе`,
        yAxisID: "yPosition",
        data: props.globalTopPositionData.map((point) => ({x: point.date, y: point.value})),
        borderColor: '#e3d58a',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: `Рейтинг`,
        yAxisID: "yRating",
        data: props.ratingData.map((point) => ({x: point.date, y: point.value})),
        borderColor: '#8ab9e3',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: { display: false, text: 'Дата' },
      type: 'time',
      time: {
        parser: 'yyyy-MM-dd',
        tooltipFormat: 'dd.MM.yyyy',
        displayFormats: {
          day: 'dd.MM.yyyy'
        },
        unit: 'day'
      },
    },
    yPosition: {
      position: "right",
      display: "auto",
      min: 1,
      beginAtZero: false,
      title: { display: false, text: 'Позиция' },
      reverse: true, // Инверсия: меньшие позиции выше
      suggestedMin: 1, // Минимальная позиция
      grid: { drawOnChartArea: false },
    },
    yRating: {
      position: "left",
      display: "auto",
      title: { display: false, text: 'Рейтинг' },
      grid: { drawOnChartArea: false },
    },
  },
  plugins: {
    legend: { 
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 14,
        padding: 12,
        font: {
          size: 13,
          style: (context) => context.hidden ? 'italic' : 'normal',
          color: (context) => context.hidden ? '#aaa' : '#333'
        },
        color: '#333',
        generateLabels: (chart: Chart) => {
          return chart.data.datasets.map((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            const hidden = meta.hidden;
            return {
              text: dataset.label || '',
              fillStyle: hidden ? '#ddd' : dataset.borderColor as string,
              strokeStyle: hidden ? '#bbb' : dataset.borderColor as string,
              lineWidth: 1,
              pointStyle: 'circle',
              hidden,
              datasetIndex: i
            };
          });
        }
      },
      onClick: (e: MouseEvent, legendItem: { datasetIndex?: number }, legend: { chart: Chart }) => {
        const chart = legend.chart;
        if (legendItem.datasetIndex !== undefined) {
          const meta = chart.getDatasetMeta(legendItem.datasetIndex);
          meta.hidden = !meta.hidden;
          chart.update();
        }
      }
    },
    tooltip: { 
      mode: 'index', 
      intersect: false,
      filter: (tooltipItem) => {
        // Скрываем tooltip для скрытых датасетов
        return !tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex).hidden;
      }
    }
  },
};
</script>

<style scoped>
.chart-container {
  width: 100%;
  margin: 0;
  padding: 20px 0;
}

.chart-wrapper {
  height: 400px;
}

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #42A5F5;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>