<template>
  <div>
    <input
      v-model="searchQuery"
      @input="onInput"
      placeholder="Введите имя игрока"
      class="search-input"
    />
    <ul v-if="suggestions.length" class="suggestions">
      <li
        v-for="player in suggestions"
        :key="player.id"
        @click="selectPlayer(player.id)"
      >
        {{ player.name }} ({{ player.year }}, {{ player.region }})
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePlayerStore } from '@/stores/player';

const searchQuery = ref('');
const store = usePlayerStore();
const { suggestions, fetchSuggestions, fetchRatings } = store;

const onInput = () => {
  fetchSuggestions(searchQuery.value);
};

const selectPlayer = (playerId) => {
  fetchRatings(playerId);
  searchQuery.value = ''; // Очистить поле после выбора
};
</script>

<style scoped>
.search-input {
  padding: 8px;
  width: 300px;
}
.suggestions {
  list-style: none;
  padding: 0;
  border: 1px solid #ccc;
  max-height: 200px;
  overflow-y: auto;
}
.suggestions li {
  padding: 8px;
  cursor: pointer;
}
.suggestions li:hover {
  background-color: #f0f0f0;
}
</style>