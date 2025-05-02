<template>
  <div class="chart-container">
    <!-- График для активного source и playType -->
    <div class="chart-wrapper">
      <Chart
        v-if="ratingData.length"
        type="line"
        :data="chartData"
        :options="chartOptions"
      />
      <div v-else-if="isLoading" class="spinner-container">
        <div class="spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { playerStore, type DataPoint } from '@/stores/player';
import { Chart } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { PlayType } from '@/api';
import { formatDate } from '@/common';

ChartJS.register(Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement);


const props = defineProps<{
  ratingData: DataPoint[];
  globalTopPositionData: DataPoint[];
  actualTopPositionData: DataPoint[];
  isLoading: boolean;
}>();

const pStore = playerStore();

// Цвета для playType
const playTypeColors: Record<PlayType, string> = {
  WD: '#42A5F5',
  WS: '#FF6384',
  MD: '#36A2EB',
  MS: '#FFCE56',
  XD: '#4BC0C0',
};

// Данные для графика текущего source и playType
const chartData = computed(() => {
  return {
    labels: props.ratingData.map((point) => formatDate(point.date)),
    datasets: [
      {
        label: `Рейтинг (${pStore.selectedPlayType})`,
        data: props.ratingData.map((point) => point.value),
        borderColor: playTypeColors[pStore.selectedPlayType as PlayType],
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
    x: { title: { display: false, text: 'Дата' } },
    y: { title: { display: false, text: 'Рейтинг' } },
  },
  plugins: { legend: { display: false } },
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
</style>