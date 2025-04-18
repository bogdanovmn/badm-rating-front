import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getPlayerRatings, searchPlayers } from '@/api';
import type { Player, Rating } from '@/api';

export const usePlayerStore = defineStore('player', () => {
  const selectedPlayer = ref<Player | null>(null);
  const ratings = ref<Rating[]>([]);
  const suggestions = ref<Player[]>([]);
  const selectedSource = ref<string | null>(null);
  const selectedType = ref<string | null>(null);

  const selectPlayer = (player: Player) => {
    selectedPlayer.value = player;
    suggestions.value = []; // Очищаем список предложений при выборе игрока
  };

  const fetchRatings = async (playerId: string) => {
    try {
      const response = await getPlayerRatings(playerId);
      ratings.value = response.data; // API возвращает Rating[]
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
      ratings.value = [];
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      suggestions.value = [];
    } else {
      console.log('Fetching suggestions for:', query);
      try {
        const response = await searchPlayers(query);
        suggestions.value = response.data; // API возвращает Player[]
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        suggestions.value = [];
      }
    }
  };

  const clearSuggestions = () => {
    suggestions.value = [];
  };

  const selectSource = (source: string) => {
    selectedSource.value = source;
  };

  const selectType = (type: string) => {
    selectedType.value = type;
  };

  return {
    selectedPlayer,
    ratings,
    suggestions,
    selectedSource,
    selectedType,
    selectPlayer,
    fetchRatings,
    fetchSuggestions,
    clearSuggestions,
    selectSource,
    selectType,
  };
});