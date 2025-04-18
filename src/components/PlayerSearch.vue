<template>
  <div class="search-container">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Введите имя игрока"
      class="search-input"
      @input="handleInput"
    />
    <div v-if="suggestions.length" class="suggestions-list">
      <div
        v-for="player in suggestions"
        :key="player.id"
        class="player-row"
        @click="onSelectPlayer(player)"
      >
        <span class="player-name">{{ player.details.name }}</span>
        <div class="player-badges">
          <span class="badge">{{ player.details.year }}</span>
          <span class="badge">{{ player.details.region }}</span>
          <span v-if="player.details.rank !== 'NO_RANK'" class="badge">{{ player.details.rank }}</span>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="spinner-container">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/player';
import type { Player } from '@/api';
import { debounce } from 'lodash';

const store = usePlayerStore();
const { fetchSuggestions, fetchRatings, clearSuggestions, selectPlayer, selectSource, selectType } = store;
const router = useRouter();

const searchQuery = ref('');
const isLoading = ref(false);

// Данные из стора
const suggestions = computed(() => store.suggestions);
const debouncedFetchSuggestions = debounce(fetchSuggestions, 450);

// Обработка ввода в поиск
const handleInput = async () => {
  debouncedFetchSuggestions(searchQuery.value);
};

// Выбор игрока
const onSelectPlayer = async (player: Player) => {
  try {
    selectPlayer(player); // Передаем полный объект Player, очищает suggestions
    searchQuery.value = ''; // Сбрасываем поле ввода
    await fetchRatings(player.id);

    // Устанавливаем source и type (берем первую доступную группу из ratings)
    if (store.ratings.length > 0) {
      const firstRating = store.ratings[0];
      selectSource(firstRating.source);
      selectType(firstRating.playType);
    }

    router.push('/'); // Переходим на страницу графика
  } catch (error) {
    console.error('Error selecting player:', error);
    router.push('/'); // Переходим, даже если ошибка
  }
};

// Очистка предложений при изменении запроса
watch(searchQuery, () => {
  if (!searchQuery.value) {
    clearSuggestions();
  }
});
</script>

<style scoped>
.search-container {
  width: 100%;
  margin: 0;
  padding: 20px 0;
}

.search-input {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 10px 16px 10px 36px;
  font-size: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 15px;
  display: block;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 10px center;
  background-size: 18px;
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

.player-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  background-color: #F0F4F8;
  color: #151e27;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
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
  .search-input {
    max-width: 100%;
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
}
</style>