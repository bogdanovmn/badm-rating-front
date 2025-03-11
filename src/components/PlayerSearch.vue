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
        @click="selectPlayer(player.id)"
      >
        {{ player.details.name }} ({{ player.details.year }}, {{ player.details.region }})
      </li>
    </ul>
    <p v-else>No suggestions yet</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePlayerStore } from '@/stores/player';

const searchQuery = ref('');
const store = usePlayerStore();
const { fetchSuggestions, fetchRatings } = store;

const suggestionsList = computed(() => store.suggestions);

const onInput = async () => {
  // console.log('Input changed:', searchQuery.value);
  await fetchSuggestions(searchQuery.value);
  // console.log('Suggestions after fetch call:', store.suggestions);
};

const selectPlayer = (playerId) => {
  // console.log('Player selected:', playerId);
  fetchRatings(playerId);
  searchQuery.value = '';
};
</script>