<template>
  <div class="chart-container">
    <SourceTypeFilter
      :selected-source="selectedSource"
      :selected-play-type="selectedPlayType"
      :available-sources="ratingData"
      @update:filter="setRatingFilter"
    />
    <!-- График для активного source и playType -->
    <div class="chart-wrapper">
      <Chart
        v-if="hasChartData"
        type="line"
        :data="chartData"
        :options="chartOptions"
      />
      <div v-else-if="pStore.isLoading" class="spinner-container">
        <div class="spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { playerStore } from '@/stores/player';
import { Chart } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { PlayType, Source } from '@/api';
import { sourceOrder, playTypeOrder } from '@/common';
import SourceTypeFilter from '@/components/SourceTypeFilter.vue';

ChartJS.register(Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement);

const pStore = playerStore();

const ratingData = computed(() => pStore.ratingHistory());
const selectedSource = ref<Source | null>(null);
const selectedPlayType = ref<PlayType | null>(null);

// Цвета для playType
const playTypeColors: Record<PlayType, string> = {
  WD: '#42A5F5',
  WS: '#FF6384',
  MD: '#36A2EB',
  MS: '#FFCE56',
  XD: '#4BC0C0',
};


// Установка активного source и playType
function setRatingFilter({ source, playType }: { source: Source; playType: PlayType }) {
  selectedSource.value = source;
  selectedPlayType.value = playType;
}

// Инициализация выбора source и playType
function initializeSelection(): void {
  if (ratingData.value.size === 0) {
    selectedSource.value = null;
    selectedPlayType.value = null;
    return;
  }

  // Находим первый доступный source в заданном порядке
  const availableSource = sourceOrder.find((source) => ratingData.value.has(source));
  if (!availableSource) {
    selectedSource.value = null;
    selectedPlayType.value = null;
    return;
  }

  selectedSource.value = availableSource;

  // Находим первый доступный playType в заданном порядке
  const availablePlayType = playTypeOrder.find((playType) =>
    ratingData.value.get(availableSource)!.has(playType)
  );
  selectedPlayType.value = availablePlayType || null;
}

// Следим за изменением ratingData и инициализируем выбор
watch(ratingData, () => {
  initializeSelection();
}, { immediate: true });

// Данные для графика текущего source и playType
const chartData = computed(() => {
  if (!selectedSource.value || !selectedPlayType.value) {
    return { labels: [], datasets: [] };
  }

  const currentRatings = ratingData.value.get(selectedSource.value)?.get(selectedPlayType.value) || {};
  // Преобразуем объект { [date: string]: number } в массив точек
  const dataPoints = Object.entries(currentRatings)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    labels: dataPoints.map((point) => new Date(point.date).toLocaleDateString('ru-RU')),
    datasets: [
      {
        label: `Рейтинг (${selectedPlayType.value})`,
        data: dataPoints.map((point) => point.value),
        borderColor: playTypeColors[selectedPlayType.value as PlayType],
        fill: false,
        tension: 0.4,
      },
    ],
  };
});

// Проверка, есть ли данные для графика
const hasChartData = computed(() => {
  return (
    selectedSource.value &&
    selectedPlayType.value &&
    ratingData.value.get(selectedSource.value)?.get(selectedPlayType.value) &&
    Object.keys(ratingData.value.get(selectedSource.value)!.get(selectedPlayType.value)!).length > 0
  );
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
.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42A5F5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chart-container {
  width: 100%;
  margin: 0;
  padding: 20px 0;
}

.source-groups {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.source-group {
  border-radius: 8px;
  padding: 10px;
  min-width: 160px;
  box-sizing: border-box;
  border-width: 0.5px;
}

.source-group legend {
  font-size: 0.9rem;
  font-weight: 400;
  padding: 0 8px;
  margin: 0;
}

.playtype-tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
}

.tab-button {
  flex: 1;
  padding: 6px 12px;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
  text-align: center;
  background-color: #F5FAFF;
}

.tab-button:hover {
  border-color: #999;
}

.tab-button.active {
  color: #333;
  font-weight: 700;
  border-color: transparent;
  background-color: #BFDBFE;
}

.tab-button:disabled {
  display: none;
}

.source-group[data-source="RNBFJunior"] .tab-button {
  background-color: #FFF5F0;
}

.source-group[data-source="RNBFJunior"] .tab-button.active {
  background-color: #FDBA74;
}

.source-group:disabled {
  display: none;
}

.chart-wrapper {
  height: 400px;
}

.no-data-message {
  text-align: center;
  color: #6B7280;
  font-size: 1rem;
  padding: 20px;
}
</style>