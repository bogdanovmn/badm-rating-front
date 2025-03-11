<template>
  <div>
    <p>Chart will be here</p>
    <Chart
      v-if="ratings.length"
      type="line"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { Chart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';

// Регистрация компонентов Chart.js
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

const store = usePlayerStore();
const { ratings } = store;

const chartData = computed(() => ({
  labels: ratings.value.map(r => r.date),
  datasets: [
    {
      label: 'Рейтинг игрока',
      data: ratings.value.map(r => r.personalRating),
      borderColor: '#42A5F5',
      tension: 0.1,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};
</script>

<style scoped>
div {
  height: 400px;
}
</style>