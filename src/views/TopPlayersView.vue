<template>
  <div class="top-players-container">
    <h1 class="text-2xl font-bold mb-3">Топ игроков</h1>

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
      <div v-for="item in selectedGroupData" :key="item.player.id" class="player-row">
        <div class="player-info">
          <span class="position-badge">{{ item.position }}</span>
          <span class="player-name" @click="goToPlayerRatings(item.player)">{{ item.player.details.name }}</span>
          <span class="rating">{{ item.rating }}</span>
        </div>
        <div class="player-badges">
          <div class="badges-left">
            <span class="badge">{{ item.player.details.year }}</span>
            <span class="badge">{{ item.player.details.region }}</span>
            <span v-if="item.player.details.rank !== 'NO_RANK'" class="badge">{{ item.player.details.rank }}</span>
          </div>
          <span class="badge badge-date">{{ formatDate(item.updatedAt) }}</span>
        </div>
      </div>
    </div>
    <p v-else class="text-gray-500">Нет данных для этой группы.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTopPlayersStore } from '@/stores/top';
import { usePlayerStore } from '@/stores/player';
import type { TopPlayerGroup, Player } from '@/api';

export default defineComponent({
  name: 'TopPlayers',
  setup() {
    const store = useTopPlayersStore();
    const storePlayer = usePlayerStore();
    const router = useRouter();

    // Получаем данные из store
    const groups = computed(() => store.groups);
    const selectedGroup = computed(() => store.selectedGroup);
    const selectedGroupData = computed(() => store.selectedGroupData);
    const isLoading = computed(() => store.isLoading);

    // Цвета для source (гармоничные с бейджем и рейтингом)
    const sourceColors = {
      RNBF: {
        background: '#FFF8E7', // Очень светлый кремово-золотистый
        border: '#F5F5F5', // Мягкий серый, почти незаметный
        text: '#6B7280', // Серый для читаемости
      },
      RNBFJunior: {
        background: '#FFF7E0', // Еще светлее золотисто-кремовый
        border: '#F5F5F5', // Мягкий серый
        text: '#6B7280',
      },
    };

    // Маппинг имен source
    const sourceNameMap = {
      RNBF: 'НФБР',
      RNBFJunior: 'НФБР Юниорский',
    };

    const mapSourceName = (source: string) => sourceNameMap[source] || source;

    // Уникальные source
    const sources = computed(() => [...new Set(groups.value.map((g) => g.source))]);

    // Получение type для конкретного source
    const getTypesForSource = (source: string) => {
      return groups.value.filter((g) => g.source === source).map((g) => g.type);
    };

    // Выбор группы
    const selectGroup = (source: string, type: string) => {
      store.selectGroup(source, type);
    };

    // Форматирование даты
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('ru-RU');
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
      store.fetchTopPlayers();
    });

    return {
      groups,
      selectedGroup,
      selectedGroupData,
      isLoading,
      sources,
      getTypesForSource,
      selectGroup,
      sourceColors,
      mapSourceName,
      formatDate,
      goToPlayerRatings,
    };
  },
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

.player-info {
  display: flex;
  align-items: center;
  width: 100%;
  flex-wrap: nowrap;
  gap: 12px;
}

.position-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #FFE4B5;
  color: #333;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 500;
}

.player-name {
  flex: 1;
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
  color: #DAA520;
  margin-left: auto;
}

.player-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.badges-left {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.badge {
  background-color: #F0F4F8;
  color: #151e27;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-date {
  background-color: #F8FAFC;
  color: #CBD5E1; /* Светлый шрифт */
  margin-left: auto;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
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
    gap: 8px;
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
}
</style>