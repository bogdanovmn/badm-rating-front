import { defineStore } from 'pinia';
import { ref } from 'vue';
import { searchPlayers, getPlayerRatings } from '@/api';
import type { Player, Rating } from '@/api';

export const usePlayerStore = defineStore('player', () => {
  const suggestions = ref<Player[]>([]);
  const selectedPlayer = ref<Player | null>(null);
  const ratings = ref<Rating[]>([]);

  async function fetchSuggestions(name: string) {
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

  async function fetchRatings(playerId: string) {
    try {
      const response = await getPlayerRatings(playerId);
      ratings.value = response.data;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      ratings.value = [];
    }
  }

  function selectPlayer(playerId: string) {
    selectedPlayer.value = suggestions.value.find((p: Player) => p.id == playerId) ?? null;
  }

  function clearSuggestions() {
    suggestions.value = []; // Очищаем список предложений
    console.log('Suggestions cleared');
  }

  return { suggestions, selectedPlayer, ratings, fetchSuggestions, fetchRatings, clearSuggestions, selectPlayer };
});