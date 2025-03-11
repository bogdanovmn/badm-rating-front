<template>
  <div>
    <p>Chart will be here</p>
    <Chart
      v-if="ratingData.length"
      type="line"
      :data="chartData"
      :options="chartOptions"
    />
    <p v-else>No ratings data yet</p>
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

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const store = usePlayerStore();
const { ratings } = store;
const ratingData = computed(() => store.ratings);

// Цвета для разных типов игры
const colors = {
  WD: '#42A5F5', // Синий
  WS: '#FF6384', // Красный
  MD: '#36A2EB', // Голубой
  MS: '#FFCE56', // Жёлтый
  XD: '#4BC0C0', // Бирюзовый
  // Добавьте другие типы и цвета, если нужно
};

const chartData = computed(() => {
  console.log('Computing chartData, ratings:', ratingData.value);

  // Извлекаем все уникальные даты для оси X
  const uniqueDates = [...new Set(ratingData.value.map(r => r.date))].sort();

  // Группируем рейтинги по playType
  const groupedByPlayType = ratingData.value.reduce((acc, rating) => {
    if (!acc[rating.playType]) {
      acc[rating.playType] = [];
    }
    acc[rating.playType].push(rating);
    return acc;
  }, {});

  // Создаём datasets для каждого playType
  const datasets = Object.keys(groupedByPlayType).map(playType => {
    const ratingsForType = groupedByPlayType[playType];
    // Создаём массив значений, соответствующий уникальным датам
    const data = uniqueDates.map(date => {
      const rating = ratingsForType.find(r => r.date === date);
      return rating ? rating.value : null; // null для пропусков
    });

    return {
      label: `Рейтинг (${playType})`,
      data,
      borderColor: colors[playType] || '#999999', // Цвет по умолчанию, если тип неизвестен
      fill: false,
      tension: 0.1,
    };
  });

  return {
    labels: uniqueDates,
    datasets,
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: 'Дата',
      },
    },
    y: {
      title: {
        display: true,
        text: 'Рейтинг',
      },
    },
  },
  plugins: {
    legend: {
      display: true, // Показываем легенду для разных типов
    },
  },
};

console.log('Current ratings in component:', ratings.value);
</script>

<style scoped>
div {
  height: 400px;
}
</style>
