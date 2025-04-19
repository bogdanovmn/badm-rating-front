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
        :data-source="source"
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
const playerData = computed(() => {
  console.log('playerData:', store.selectedPlayer); // Отладка: проверяем selectedPlayer
  return store.selectedPlayer?.details;
});
const selectedSource = computed(() => store.selectedSource);
const selectedType = computed(() => store.selectedType);

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
    border: '#D0E0FF', // Голубая граница
    text: '#6B7280', // Серый для читаемости
  },
  RNBFJunior: {
    background: '#FFF7ED', // Светло-оранжевый
    border: '#FFE4CC', // Мягкий оранжевый
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
    labels: currentRatings.map((r) => new Date(r.date).toLocaleDateString('ru-RU')),
    datasets: [
      {
        label: `Рейтинг (${activePlayType.value})`,
        data: currentRatings.map((r) => r.value),
        borderColor: colors[activePlayType.value] || '#42A5F5',
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
    x: { title: { display: false, text: 'Дата' } },
    y: { title: { display: false, text: 'Рейтинг' } },
  },
  plugins: { legend: { display: false } },
};

// Автоматический выбор активного source и playType
watch(
  [ratingData, selectedSource, selectedType],
  ([newRatings, newSource, newType]) => {
    if (newRatings && newRatings.length) {
      const availableSources = Object.keys(ratingsBySourceAndPlayType.value);
      if (
        newSource &&
        newType &&
        availableSources.includes(newSource) &&
        getPlayTypesForSource(newSource).includes(newType)
      ) {
        activeSource.value = newSource;
        activePlayType.value = newType;
      } else {
        activeSource.value = availableSources[0] || '';
        const availableTypes = getPlayTypesForSource(activeSource.value);
        activePlayType.value = availableTypes[0] || '';
      }
    } else {
      activeSource.value = '';
      activePlayType.value = '';
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.chart-container {
  width: 100%;
  margin: 0;
  padding: 20px 0;
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
  background-color: #F0F4F8;
  color: #151e27;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
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
  background-color: #F5FAFF; /* Очень светлый голубой для RNBF */
}

.tab-button:hover {
  border-color: #999;
}

.tab-button.active {
  color: #333;
  font-weight: 700;
  border-color: transparent;
  background-color: #BFDBFE; /* Голубой для активной кнопки RNBF */
}

.source-group[data-source="RNBFJunior"] .tab-button {
  background-color: #FFF5F0; /* Очень светлый оранжевый для RNBFJunior */
}

.source-group[data-source="RNBFJunior"] .tab-button.active {
  background-color: #FDBA74; /* Гармоничный оранжевый для активной кнопки RNBFJunior */
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