import { defineStore } from 'pinia';
import { ref } from 'vue';
import { searchPlayers, getPlayerRatings } from '@/api';

export const usePlayerStore = defineStore('player', () => {
  const suggestions = ref([]);
  const selectedPlayer = ref(null);
  const ratings = ref([]);

  async function fetchSuggestions(name) {
    if (name.length < 2) {
      suggestions.value = [];
      return;
    }
    const response = await searchPlayers(name);
    suggestions.value = response.data;
  }

  async function fetchRatings(playerId) {
    const response = await getPlayerRatings(playerId);
    ratings.value = response.data;
    selectedPlayer.value = suggestions.value.find(p => p.id === playerId);
  }

  return { suggestions, selectedPlayer, ratings, fetchSuggestions, fetchRatings };
});