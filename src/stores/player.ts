import { defineStore } from 'pinia';
import { ref } from 'vue';
import { searchPlayers, getPlayerRatings } from '@/api';

export const usePlayerStore = defineStore('player', () => {
  const suggestions = ref([]);
  const selectedPlayer = ref({});
  const ratings = ref([]);

  async function fetchSuggestions(name) {
    if (name.length < 3) {
      suggestions.value = [];
      return;
    }
    console.log('Fetching suggestions for:', name);
    try {
      const response = await searchPlayers(name);
      // console.log('Response data:', response.data);
      if (!Array.isArray(response.data)) {
        console.warn('Response.data is not an array:', response.data);
        suggestions.value = [];
      } else {
        suggestions.value = response.data;
      }
      // console.log('Suggestions updated:', suggestions.value);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      suggestions.value = [];
    }
  }

  async function fetchRatings(playerId) {
    try {
      const response = await getPlayerRatings(playerId);
      // console.log('Ratings response:', response.data);
      ratings.value = response.data;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      ratings.value = [];
    }
  }

  function selectPlayer(playerId) {
    selectedPlayer.value = suggestions.value.find(p => p.id == playerId);
  }

  function clearSuggestions() {
    suggestions.value = []; // Очищаем список предложений
    console.log('Suggestions cleared');
  }

  return { suggestions, selectedPlayer, ratings, fetchSuggestions, fetchRatings, clearSuggestions, selectPlayer };
});