<template>
  <div>
    <input
      v-model="searchQuery"
      @input="onInput"
      placeholder="Введите имя игрока"
      class="search-input"
    />
    <ul v-if="suggestionsList.length" class="suggestions">
      <li
        v-for="player in suggestionsList"
        :key="player.id"
        @click="onSelectPlayer(player.id)"
      >
        {{ player.details.name }} ({{ player.details.year }}, {{ player.details.region }})
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { debounce } from 'lodash';
import { usePlayerStore } from '@/stores/player';

const searchQuery = ref('');
const store = usePlayerStore();
const { fetchSuggestions, fetchRatings, clearSuggestions, selectPlayer } = store;

const suggestionsList = computed(() => store.suggestions);
const debouncedFetchSuggestions = debounce(fetchSuggestions, 450);

const onInput = () => {
  debouncedFetchSuggestions(searchQuery.value);
};

const onSelectPlayer = (playerId) => {
  fetchRatings(playerId);
  selectPlayer(playerId);
  clearSuggestions();
  searchQuery.value = ''
};
</script>

<style scoped>
/* Контейнер для центрирования */
.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh; /* Минимальная высота для центрирования по вертикали */
  padding: 20px;
}

/* Поле ввода */
.search-input {
  width: 100%;
  max-width: 100%; /* Ограничение ширины */
  padding: 15px 20px; /* Увеличенные отступы */
  font-size: 1.5rem; /* Крупный шрифт */
  border: 2px solid #42a5f5; /* Цвет границы */
  border-radius: 8px; /* Скругленные углы */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Лёгкая тень */
  outline: none; /* Убираем стандартный outline */
  transition: border-color 0.3s, box-shadow 0.3s; /* Плавные переходы */
}

/* Фокус на поле ввода */
.search-input:focus {
  border-color: #1e88e5; /* Более тёмный синий при фокусе */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

/* Список предложений */
.suggestions {
  list-style: none;
  padding: 0;
  margin-top: 10px; /* Отступ от поля ввода */
  width: 100%;
  max-width: 100%; /* Соответствует ширине поля ввода */
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  max-height: 85%; /* Ограничение высоты */
  overflow-y: auto; /* Прокрутка при необходимости */
}

/* Элементы списка */
.suggestions li {
  padding: 12px 20px; /* Увеличенные отступы */
  font-size: 1.1rem; /* Чуть крупнее шрифт */
  cursor: pointer;
  transition: background-color 0.2s; /* Плавный переход */
}

/* Ховер на элементы списка */
.suggestions li:hover {
  background-color: #f0f8ff; /* Светло-голубой фон */
}
</style>