<template>
  <div class="top-players-container">
    <h1 class="text-2xl font-bold mb-3">Топ игроков</h1>

    <!-- Кнопки переключения типа топа -->
    <div class="top-type-toggle mb-4">
      <button
        :class="{ 'toggle-button': true, active: topType === 'actual' }"
        @click="selectTopType('actual')"
      >
        Текущий
      </button>
      <button
        :class="{ 'toggle-button': true, active: topType === 'all-time' }"
        @click="selectTopType('all-time')"
      >
        За все время
      </button>
    </div>

    <!-- Группы по source с кнопками type -->
    <div class="source-groups">
      <fieldset
        v-for="source in sources"
        :key="source"
        class="source-group"
        :style="{
          backgroundColor: sourceColors[source]?.background || '#FAFAFA',
          borderColor: sourceColors[source]?.border || '#F5F5F5'
        }"
      >
        <legend :style="{ color: sourceColors[source]?.text || '#A0A0A0' }">
          {{ mapSourceName(source) }}
        </legend>
        <div class="playtype-tabs">
          <button
            v-for="type in getTypesForSource(source)"
            :key="type"
            :class="{ 'tab-button': true, active: selectedGroup?.source === source && selectedGroup?.type === type }"
            @click="selectGroup(source, type)"
          >
            {{ type }}
          </button>
        </div>
      </fieldset>
    </div>

    <!-- Спиннер при загрузке -->
    <div v-if="isLoading" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <!-- Список игроков -->
    <div v-else-if="selectedGroupData.length" class="players-list">
      <div
        v-for="item in selectedGroupData"
        :key="item.player.id"
        class="player-row"
        :class="{
          'row-gold': item.position === 1,
          'row-silver': item.position === 2,
          'row-bronze': item.position === 3
        }"
      >
        <div class="player-info">
          <span
            class="position-badge"
            :class="{
              'position-gold': item.position === 1,
              'position-silver': item.position === 2,
              'position-bronze': item.position === 3
            }"
          >
            {{ item.position }}
          </span>
          <span class="player-name" @click="goToPlayerRatings(item.player)">{{ item.player.details.name }}</span>
          <span
            v-if="item.positionChange !== 0"
            class="change-badge"
            :class="{
              'change-positive': item.positionChange > 0,
              'change-negative': item.positionChange < 0
            }"
          >
            {{ formatPositionChange(item.positionChange) }}
          </span>
          <span
            class="rating"
            :class="{
              'rating-gold': item.position === 1,
              'rating-silver': item.position === 2,
              'rating-bronze': item.position === 3
            }"
          >
            {{ item.rating }}
          </span>
          <span
            v-if="item.ratingChange !== 0"
            class="change-badge"
            :class="{
              'change-positive': item.ratingChange > 0,
              'change-negative': item.ratingChange < 0
            }"
          >
            {{ formatRatingChange(item.ratingChange) }}
          </span>
        </div>
        <div class="player-badges">
          <span class="badge">{{ item.player.details.year }}</span>
          <span class="badge badge-secondary">{{ item.player.details.region }}</span>
          <span v-if="item.player.details.rank !== 'NO_RANK'" class="badge badge-secondary">
            {{ item.player.details.rank }}
          </span>
          <span class="badge badge-secondary badge-date">{{ formatDate(item.updatedAt) }}</span>
        </div>
      </div>
    </div>
    <p v-else class="text-gray-500">Нет данных для этой группы.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTopPlayersStore } from '@/stores/top';
import { usePlayerStore } from '@/stores/player';
import type { TopPlayerGroup, Player } from '@/api';

const store = useTopPlayersStore();
const storePlayer = usePlayerStore();
const router = useRouter();

// Получаем данные из store
const groups = computed(() => store.groups);
const selectedGroup = computed(() => store.selectedGroup);
const selectedGroupData = computed(() => store.selectedGroupData);
const isLoading = computed(() => store.isLoading);
const topType = computed(() => store.topType);

// Тип для ключей source
type SourceType = 'RNBF' | 'RNBFJunior';

// Цвета для source
const sourceColors: Record<SourceType, { background: string; border: string; text: string }> = {
  RNBF: { background: '#F0F6FF', border: '#D0E0FF', text: '#6B7280' },
  RNBFJunior: { background: '#FFF7ED', border: '#FFE4CC', text: '#6B7280' },
};

// Маппинг имен source
const sourceNameMap: Record<SourceType, string> = {
  RNBF: 'НФБР',
  RNBFJunior: 'НФБР Юниорский',
};

// Список playType
const playTypes = ['MS', 'WS', 'MD', 'WD', 'XD'] as const;
// Уникальные source
const sources: SourceType[] = ['RNBF', 'RNBFJunior'];
const mapSourceName = (source: SourceType) => sourceNameMap[source] || source;

// Получение type для конкретного source
const getTypesForSource = (source: string) => {
  return groups.value.filter((g) => g.source === source).map((g) => g.type);
};

// Выбор типа топа
const selectTopType = (type: 'actual' | 'all-time') => {
  store.selectTopType(type);
};

// Выбор группы
const selectGroup = (source: string, type: string) => {
  store.selectGroup(source, type);
};

// Форматирование даты
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ru-RU');
};

// Форматирование изменения позиции
const formatPositionChange = (change: number) => {
  if (change > 0) return `↑ ${change}`;
  if (change < 0) return `↓ ${Math.abs(change)}`;
  return '';
};

// Форматирование изменения рейтинга
const formatRatingChange = (change: number) => {
  if (change > 0) return `↑ ${change}`;
  if (change < 0) return `↓ ${Math.abs(change)}`;
  return '';
};

// Переход на домашнюю страницу с графиком игрока
const goToPlayerRatings = async (player: Player) => {
  try {
    console.log('Selected player:', player); // Отладка: проверяем данные игрока

    // Установка source и type
    if (selectedGroup.value?.source && selectedGroup.value?.type) {
      storePlayer.selectSource(selectedGroup.value.source);
      storePlayer.selectType(selectedGroup.value.type);
    }

    storePlayer.selectPlayer(player); // Устанавливаем игрока с полными данными
    await storePlayer.fetchRatings(player.id); // Загружаем рейтинги
    router.push('/'); // Переходим на домашнюю страницу
  } catch (error) {
    console.error('Error fetching player ratings:', error);
    router.push('/'); // Переходим, даже если ошибка
  }
};

// Загрузка данных при монтировании
onMounted(() => {
  store.selectTopType('actual'); // Устанавливаем Текущий топ
  store.selectGroup('RNBF', 'MS'); // Устанавливаем RNBF, MS по умолчанию
});
</script>

<style scoped>
.top-players-container {
  width: 100%;
  margin: 0;
  padding: 20px 0;
}

h1 {
  text-align: center;
  margin-bottom: 12px;
  font-size: 1.8rem;
}

.top-type-toggle {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.toggle-button {
  padding: 8px 16px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
  background-color: #F0F4F8;
}

.toggle-button:hover {
  background-color: #E5E7EB;
}

.toggle-button.active {
  background-color: #FFE4B5;
  border-color: transparent;
  font-weight: 700;
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
  background-color: #FFFAF0;
}

.tab-button:hover {
  border-color: #999;
}

.tab-button.active {
  color: #333;
  font-weight: 700;
  border-color: transparent;
  background-color: #FFE4B5;
}

.players-list {
  max-width: 800px;
  margin: 0 auto;
}

.player-row {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.row-gold {
  background-color: #FFFEF5;
}

.row-silver {
  background-color: #FCFDFF;
}

.row-bronze {
  background-color: #FFF9F5;
}

.player-info {
  display: flex;
  align-items: center;
  width: 100%;
  flex-wrap: nowrap;
  gap: 8px; /* Увеличено для большего расстояния */
}

.position-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #FFFFFF;
  border: 1px solid #69747e;
  color: #151e27;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 500;
}

.position-gold {
  background-color: #FFECB3;
  color: #D4A017;
  border: none;
  font-weight: 700;
}

.position-silver {
  background-color: #E2E8F0;
  color: #64748B;
  border: none;
  font-weight: 700;
}

.position-bronze {
  background-color: #F4C7AB;
  color: #9C4B1F;
  border: none;
  font-weight: 700;
}

.player-name {
  font-size: 1.2rem;
  font-weight: 500;
  color: #151e27;
  cursor: pointer;
}

.player-name:hover {
  text-decoration: underline;
}

.rating {
  font-size: 1rem;
  font-weight: 500;
  color: #151e27;
  margin-left: auto;
}

.rating-gold {
  color: #D4A017;
  font-weight: 700;
}

.rating-silver {
  color: #64748B;
  font-weight: 700;
}

.rating-bronze {
  color: #9C4B1F;
  font-weight: 700;
}

.change-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.625rem;
  font-weight: 500;
}

.change-positive {
  background-color: #f6fff9;
  color: #7db9a1;
}

.change-negative {
  background-color: #fdf7f7;
  color: #b87878;
}

.player-badges {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
  margin-left: 36px; /* 28px (position-badge) + 8px (gap) */
}

.badge {
  background-color: #F0F4F8;
  color: #151e27;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-secondary {
  background-color: #F8FAFC;
  color: #CBD5E1;
}

.badge-date {
  margin-left: auto;
}

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

@media (max-width: 768px) {
  .top-type-toggle {
    flex-direction: column;
    gap: 8px;
  }

  .toggle-button {
    padding: 6px 12px;
    font-size: 0.9rem;
  }

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

  .player-info {
    gap: 6px; /* Увеличено для мобильных */
  }

  .position-badge {
    width: 24px;
    height: 24px;
    font-size: 0.8rem;
  }

  .player-name {
    font-size: 1.1rem;
  }

  .rating {
    font-size: 0.9rem;
  }

  .player-badges {
    margin-left: 30px; /* 24px (position-badge) + 6px (gap) */
  }
}
</style>