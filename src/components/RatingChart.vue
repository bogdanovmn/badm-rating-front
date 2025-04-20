```vue
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

    <!-- Список похожих игроков -->
    <div v-if="similarPlayers.length" class="similar-players">
      <div class="warning-title">
        <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4A261" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/></svg>
        <b>Возможное</b> дублирование профиля
      </div>
      <div class="suggestions-list">
        <div
          v-for="player in similarPlayers"
          :key="player.id"
          class="player-row"
          @click="onSelectSimilarPlayer(player)"
        >
          <span class="player-name">{{ player.details.name }}</span>
          <div class="player-badges">
            <span class="badge">{{ player.details.year }}</span>
            <span class="badge">{{ player.details.region }}</span>
            <span v-if="player.details.rank !== 'NO_RANK'" class="badge">{{ player.details.rank }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="isLoadingSimilar" class="spinner-container">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePlayerStore } from '@/stores/player';
import { Chart } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import type { Player } from '@/api';

ChartJS.register(Title, Tooltip, Legend, LineController, LineElement, CategoryScale, LinearScale, PointElement);

const store = usePlayerStore();
const router = useRouter();
const route = useRoute();

// Реактивные данные через computed
const ratingData = computed(() => store.ratings);
const playerData = computed(() => store.selectedPlayer?.details);
const similarPlayers = computed(() => store.similarPlayers);
const selectedSource = computed(() => store.selectedSource);
const selectedType = computed(() => store.selectedType);
const isLoadingSimilar = ref(false);

// Интерфейс для цветов source
interface SourceColor {
  background: string;
  border: string;
  text: string;
}

// Тип для sourceColors с сигнатурой индекса
interface SourceColors {
  [key: string]: SourceColor;
}

// Цвета для source
const sourceColors: SourceColors = {
  RNBF: {
    background: '#F0F6FF',
    border: '#D0E0FF',
    text: '#6B7280',
  },
  RNBFJunior: {
    background: '#FFF7ED',
    border: '#FFE4CC',
    text: '#6B7280',
  },
};

// Тип для sourceNameMap с сигнатурой индекса
interface SourceNameMap {
  [key: string]: string;
}

// Маппинг имен source
const sourceNameMap: SourceNameMap = {
  RNBF: 'НФБР',
  RNBFJunior: 'НФБР Юниорский',
};

const mapSourceName = (source: string) => sourceNameMap[source] || source;

// Интерфейс для цветов playType
interface PlayTypeColors {
  [key: string]: string;
}

// Цвета для playType
const colors: PlayTypeColors = {
  WD: '#42A5F5',
  WS: '#FF6384',
  MD: '#36A2EB',
  MS: '#FFCE56',
  XD: '#4BC0C0',
};

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
    acc[rating.source][rating.playType] = ratingEntries.sort((a, b) => new Date(a.date).valueOf() - new Date(b.date).valueOf());
    return acc;
  }, {} as { [source: string]: { [playType: string]: { date: string; value: number }[] } });
});

// Уникальные source
const sources = computed(() => Object.keys(ratingsBySourceAndPlayType.value));

// Получение playType для конкретного source
const getPlayTypesForSource = (source: string) => {
  return Object.keys(ratingsBySourceAndPlayType.value[source] || {});
};

// Активный source и playType
const activeSource = ref('');
const activePlayType = ref('');

// Установка активного source и playType
const setActive = (source: string, type: string) => {
  activeSource.value = source;
  activePlayType.value = type;
  store.selectSource(source);
  store.selectType(type);
};

// Получение последнего значения рейтинга для таба
const getLastRating = (source: string, playType: string) => {
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

// Загрузка данных игрока и похожих игроков
const loadPlayerData = async (playerId: string) => {
  try {
    isLoadingSimilar.value = true;
    await Promise.all([
      store.fetchRatings(playerId),
      store.fetchSimilarPlayers(playerId),
    ]);
  } catch (error) {
    console.error('Error loading player data:', error);
  } finally {
    isLoadingSimilar.value = false;
  }
};

// Выбор игрока из списка похожих
const onSelectSimilarPlayer = async (player: Player) => {
  try {
    store.selectPlayer(player);
    await loadPlayerData(player.id);
    router.push('/');
  } catch (error) {
    console.error('Error selecting similar player:', error);
  }
};

// Загружаем данные при монтировании и изменении selectedPlayer
watch(
  () => store.selectedPlayer,
  (newPlayer) => {
    if (newPlayer?.id) {
      loadPlayerData(newPlayer.id);
    }
  },
  { immediate: true }
);

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

.source-group[data-source="RNBFJunior"] .tab-button {
  background-color: #FFF5F0;
}

.source-group[data-source="RNBFJunior"] .tab-button.active {
  background-color: #FDBA74;
}

.chart-wrapper {
  height: 400px;
}

.similar-players {
  margin-top: 40px;
}

.warning-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 400;
  color: #F4A261; /* Светлый оранжевый для текста */
  background-color: #FFF4E6; /* Очень светлый оранжевый фон */
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.warning-icon {
  flex-shrink: 0;
  stroke: #F4A261; /* Светлый оранжевый для иконки */
}

.suggestions-list {
  max-width: 800px;
  margin: 20px auto;
}

.player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.player-row:hover {
  background-color: #f9f9f9;
}

.player-name {
  font-size: 1.2rem;
  font-weight: 500;
  color: #151e27;
}

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
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

  .suggestions-list {
    max-width: 100%;
  }

  .player-row {
    padding: 10px;
    margin-bottom: 6px;
  }

  .player-name {
    font-size: 1.1rem;
  }

  .badge {
    font-size: 0.7rem;
    padding: 2px 6px;
  }

  .warning-title {
    font-size: 1.0rem;
    padding: 10px;
  }
}
</style>