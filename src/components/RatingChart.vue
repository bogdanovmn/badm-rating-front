<template>
  <div class="chart-container">
    <!-- Данные игрока -->
    <h1 v-if="playerData">
      {{ playerData.name }} <span class="player-details">({{ playerData.year }}, {{ playerData.region }}, {{ playerData.rank }})</span>
    </h1>

    <div class="tabs">
      <button
        v-for="type in playTypes"
        :key="type"
        :class="{ 'tab-button': true, active: activePlayType === type }"
        :style="{ backgroundColor: activePlayType === type ? colors[type] : '#f5f5f5' }"
        @click="setActivePlayType(type)"
      >
        {{ type }} ({{ getLastRating(type) }})
      </button>
    </div>

    <!-- График для активного playType -->
    <div class="chart-wrapper">
      <Chart
        v-if="ratingsByPlayType[activePlayType]?.length"
        type="line"
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { Chart } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement);

const store = usePlayerStore();

// Реактивные данные через computed
const ratingData = computed(() => store.ratings);
const playerData = computed(() => store.selectedPlayer?.details);

// Цвета для табов
const colors = {
  WD: '#42A5F5',
  WS: '#FF6384',
  MD: '#36A2EB',
  MS: '#FFCE56',
  XD: '#4BC0C0',
};

// Группировка рейтингов по playType
const ratingsByPlayType = computed(() => {
  return ratingData.value.reduce((acc, rating) => {
    if (!acc[rating.playType]) {
      acc[rating.playType] = [];
    }
    acc[rating.playType].push(rating);
    return acc;
  }, {});
});

// Уникальные playType
const playTypes = computed(() => Object.keys(ratingsByPlayType.value));

// Активный playType
const activePlayType = ref('');

// Установка активного playType
const setActivePlayType = (type) => {
  activePlayType.value = type;
};

// Получение последнего значения рейтинга для таба
const getLastRating = (playType) => {
  const ratings = ratingsByPlayType.value[playType] || [];
  return ratings.length ? ratings[ratings.length - 1].value : 'N/A';
};

// Данные для графика текущего playType
const chartData = computed(() => {
  const currentRatings = ratingsByPlayType.value[activePlayType.value] || [];

  return {
    labels: currentRatings.map(r => r.date),
    datasets: [
      {
        label: `Рейтинг (${activePlayType.value})`,
        data: currentRatings.map(r => r.value),
        borderColor: '#42A5F5', // Единый цвет для всех линий
        fill: false,
        tension: 0.4,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { title: { display: true, text: 'Дата' } },
    y: { title: { display: true, text: 'Рейтинг' } },
  },
  plugins: { legend: { display: false } },
};

// Автоматический выбор активного таба при смене игрока
watch(ratingData, (newRatings) => {
  if (newRatings && newRatings.length) {
    const availableTypes = Object.keys(ratingsByPlayType.value);
    activePlayType.value = availableTypes[0] || 'WD'; // Первый доступный тип
  }
}, { immediate: true });
</script>

<style scoped>
.chart-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

.player-details {
  color: rgb(141, 163, 182);
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-button {
  padding: 10px 20px;
  font-size: 1.1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  color: #333;
  cursor: pointer;
  /* transition: color 0.3s, border-color 0.3s; */
  transition: background-color 0.7s, color 0.6s, border-color 0.5s;
}

.tab-button:hover {
  border-color: #999;
}

.tab-button.active {
  color: white;
  border-color: transparent;
}

.chart-wrapper {
  height: 400px;
}
</style>