<template>
  <div class="chart-container">
    <!-- Данные игрока -->
    <h1 v-if="playerData">
      {{ playerData.name }}
      <span class="player-badges">
        <span class="badge">{{ playerData.year }}</span>
        <span class="badge">{{ playerData.region }}</span>
        <span v-if="playerData.rank !== 'NO_RANK'" class="badge">{{ playerData.rank }}</span>
      </span>
    </h1>

    <!-- Группы по source с кнопками playType -->
    <div class="source-groups">
      <fieldset
        v-for="source in sources"
        :key="source"
        class="source-group"
        :style="{
          backgroundColor: sourceColors[source]?.background || '#FAFAFA',
          borderColor: sourceColors[source]?.border || '#E5E5E5'
        }"
      >
        <legend :style="{ color: sourceColors[source]?.text || '#A0A0A0' }">
          {{ mapSourceName(source) }}
        </legend>
        <div class="playtype-tabs">
          <button
            v-for="type in getPlayTypesForSource(source)"
            :key="type"
            :class="{ 'tab-button': true, active: activeSource === source && activePlayType === type }"
            :style="{ backgroundColor: activeSource === source && activePlayType === type ? colors[type] : '#f5f5f5' }"
            @click="setActive(source, type)"
          >
            {{ type }} ({{ getLastRating(source, type) }})
          </button>
        </div>
      </fieldset>
    </div>

    <!-- График для активного source и playType -->
    <div class="chart-wrapper">
      <Chart
        v-if="ratingsBySourceAndPlayType[activeSource]?.[activePlayType]?.length"
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

// Цвета для playType
const colors = {
  WD: '#42A5F5',
  WS: '#FF6384',
  MD: '#36A2EB',
  MS: '#FFCE56',
  XD: '#4BC0C0',
};

// Цвета для source
const sourceColors = {
  RNBF: {
    background: '#F0F6FF', // Светло-голубой
    border: '#D0E0FF',
    text: '#6B7280', // Серый для читаемости
  },
  RNBFJunior: {
    background: '#F0FFF4', // Светло-зеленый
    border: '#C4FFD4',
    text: '#6B7280',
  },
};

// Маппинг имен source
const sourceNameMap = {
  RNBF: 'НФБР',
  RNBFJunior: 'НФБР Юниорский',
};

const mapSourceName = (source) => sourceNameMap[source] || source;

// Группировка рейтингов по source и playType
const ratingsBySourceAndPlayType = computed(() => {
  return ratingData.value.reduce((acc, rating) => {
    if (!acc[rating.source]) {
      acc[rating.source] = {};
    }
    if (!acc[rating.source][rating.playType]) {
      acc[rating.source][rating.playType] = [];
    }
    // Преобразуем объект data в массив объектов для удобства
    const ratingEntries = Object.entries(rating.data).map(([date, value]) => ({
      date,
      value,
    }));
    acc[rating.source][rating.playType] = ratingEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    return acc;
  }, {});
});

// Уникальные source
const sources = computed(() => Object.keys(ratingsBySourceAndPlayType.value));

// Получение playType для конкретного source
const getPlayTypesForSource = (source) => {
  return Object.keys(ratingsBySourceAndPlayType.value[source] || {});
};

// Активный source и playType
const activeSource = ref('');
const activePlayType = ref('');

// Установка активного source и playType
const setActive = (source, type) => {
  activeSource.value = source;
  activePlayType.value = type;
};

// Получение последнего значения рейтинга для таба
const getLastRating = (source, playType) => {
  const ratings = ratingsBySourceAndPlayType.value[source]?.[playType] || [];
  return ratings.length ? ratings[ratings.length - 1].value : 'N/A';
};

// Данные для графика текущего source и playType
const chartData = computed(() => {
  const currentRatings = ratingsBySourceAndPlayType.value[activeSource.value]?.[activePlayType.value] || [];

  return {
    //labels: currentRatings.map(r => r.date),
    labels: currentRatings.map(r => new Date(r.date).toLocaleDateString('ru-RU')),
    datasets: [
      {
        label: `Рейтинг (${activePlayType.value})`,
        data: currentRatings.map(r => r.value),
        borderColor: colors[activePlayType.value] || '#42A5F5', // Цвет линии соответствует playType
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

// Автоматический выбор активного source и playType при смене данных
watch(ratingData, (newRatings) => {
  if (newRatings && newRatings.length) {
    const availableSources = Object.keys(ratingsBySourceAndPlayType.value);
    activeSource.value = availableSources[0] || '';
    const availableTypes = getPlayTypesForSource(activeSource.value);
    activePlayType.value = availableTypes[0] || '';
  }
}, { immediate: true });
</script>

<style scoped>
.chart-container {
  width: 100%; /* Полная ширина родителя */
  margin: 0;
  padding: 20px 0; /* Оставляем только вертикальный padding */
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.player-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  background-color: #F0F4F8; /* Мягкий серо-голубой фон */
  color: #151e27; /* Темный текст, как у Ollama */
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.source-groups {
  display: flex;
  justify-content: center; /* Центрирование групп */
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.source-group {
  border-radius: 8px;
  padding: 10px;
  min-width: 160px;
  box-sizing: border-box;
}

.source-group legend {
  font-size: 0.9rem; /* Меньше шрифт */
  font-weight: 400; /* Не жирный */
  padding: 0 8px;
  margin: 0;
}

.playtype-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tab-button {
  padding: 6px 12px;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
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

@media (max-width: 768px) {
  .source-groups {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .source-group {
    width: 100%;
    padding: 8px;
  }

  .source-group legend {
    font-size: 0.85rem;
  }

  .tab-button {
    padding: 5px 10px;
    font-size: 0.85rem;
  }

  h1 {
    flex-direction: column;
    gap: 5px;
  }
}
</style>