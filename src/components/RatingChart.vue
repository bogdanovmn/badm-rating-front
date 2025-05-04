<template>
  <div class="chart-container">
    <div class="chart-wrapper">
      <VueChart
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
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  LineController, 
  LineElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  TimeScale, 
  TimeSeriesScale,
  type Chart as ChartType,
  type ChartData,
  type ChartOptions,
  type LegendItem,
  type TooltipItem,
  type ChartEvent,
  type LegendElement,
} from 'chart.js';
import { Chart as VueChart } from 'vue-chartjs';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  Title, 
  Tooltip, 
  Legend, 
  LineController, 
  LineElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  TimeScale, 
  TimeSeriesScale
);

interface Props {
  ratingData: DataPoint[];
  globalTopPositionData: DataPoint[];
  actualTopPositionData: DataPoint[];
  isLoading: boolean;
}

const props = defineProps<Props>();

const chartData = computed((): ChartData<'line'> => {
  return {
    datasets: [
      {
        label: 'Позиция в ТОПе',
        yAxisID: "yPosition",
        data: props.actualTopPositionData.map((point) => ({x: new Date(point.date).getTime(), y: point.value})),
        borderColor: '#806e0a',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: 'Позиция в глобальном ТОПе',
        yAxisID: "yPosition",
        data: props.globalTopPositionData.map((point) => ({x: new Date(point.date).getTime(), y: point.value})),
        borderColor: '#e3d58a',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        hidden: true
      },
      {
        label: 'Рейтинг',
        yAxisID: "yRating",
        data: props.ratingData.map((point) => ({x: new Date(point.date).getTime(), y: point.value})),
        borderColor: '#8ab9e3',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };
});

const chartOptions = computed((): ChartOptions<'line'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
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
        reverse: true,
        suggestedMin: 1,
        grid: { drawOnChartArea: false },
      },
      yRating: {
        position: "left",
        display: "auto",
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
          },
          generateLabels: (chart: ChartType<'line'>) => {
            return chart.data.datasets.map((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              const hidden = !!meta.hidden || !chart.isDatasetVisible(i);
              return {
                text: dataset.label || '',
                fillStyle: hidden ? '#ddd' : dataset.borderColor as string,
                strokeStyle: hidden ? '#bbb' : dataset.borderColor as string,
                lineWidth: 1,
                pointStyle: 'circle',
                hidden,
                datasetIndex: i
              } as LegendItem;
            });
          }
        },
        onClick: (e: ChartEvent, legendItem: LegendItem, legend: LegendElement<'line'>) => {
          const chart = legend.chart;
          if (legendItem.datasetIndex !== undefined) {
            const meta = chart.getDatasetMeta(legendItem.datasetIndex);
            meta.hidden = !meta.hidden;
            chart.update();
          }
        }
      },
      tooltip: {
        enabled: false,
        mode: 'index', 
        intersect: false,
        filter: (tooltipItem: TooltipItem<'line'>) => {
          return !tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex).hidden;
        }
      }
    },
  };
});
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>