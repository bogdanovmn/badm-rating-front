<template>
  <div class="chart-container">
    <SourceTypeFilter
      :selected-source="pStore.selectedSource"
      :selected-play-type="pStore.selectedPlayType"
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
  pStore.setSourceFilter(source, playType);
}

// Инициализация выбора source и playType
function initializeSelection(): void {
  if (ratingData.value.size === 0) {
    pStore.clearSourceFilter();
    return;
  }
  // Находим первый доступный source в заданном порядке
  const availableSource = sourceOrder.find((source) => ratingData.value.has(source));
  if (!availableSource) {
    pStore.clearSourceFilter()
    return;
  }
  // Находим первый доступный playType в заданном порядке
  const availablePlayType = playTypeOrder.find((playType) =>
    ratingData.value.get(availableSource)!.has(playType)
  );

  pStore.setSourceFilter(availableSource, availablePlayType!);
}

// Следим за изменением ratingData и инициализируем выбор
watch(ratingData, () => {
  initializeSelection();
}, { immediate: true });

// Данные для графика текущего source и playType
const chartData = computed(() => {
  if (!pStore.selectedSource || !pStore.selectedPlayType) {
    return { labels: [], datasets: [] };
  }

  const currentRatings = ratingData.value.get(pStore.selectedSource)?.get(pStore.selectedPlayType) || {};
  // Преобразуем объект { [date: string]: number } в массив точек
  const dataPoints = Object.entries(currentRatings)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    labels: dataPoints.map((point) => new Date(point.date).toLocaleDateString('ru-RU')),
    datasets: [
      {
        label: `Рейтинг (${pStore.selectedPlayType})`,
        data: dataPoints.map((point) => point.value),
        borderColor: playTypeColors[pStore.selectedPlayType as PlayType],
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };
});

// Проверка, есть ли данные для графика
const hasChartData = computed(() => {
  return (
    pStore.selectedSource &&
    pStore.selectedPlayType &&
    ratingData.value.get(pStore.selectedSource)?.get(pStore.selectedPlayType) &&
    Object.keys(ratingData.value.get(pStore.selectedSource)!.get(pStore.selectedPlayType)!).length > 0
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

.chart-container {
  width: 100%;
  margin: 0;
  padding: 20px 0;
}

.chart-wrapper {
  height: 400px;
}
</style>