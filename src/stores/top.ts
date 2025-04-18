import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getTopPlayers } from '@/api';
import type { TopPlayerGroup } from '@/api';

export const useTopPlayersStore = defineStore('topPlayers', () => {
  const groups = ref<TopPlayerGroup[]>([]);
  const selectedGroup = ref<{ source: string; type: string } | null>(null);
  const isLoading = ref(false);

  // Данные для выбранной группы
  const selectedGroupData = computed(() => {
    if (!selectedGroup.value) return [];
    const group = groups.value.find(
      (g) => g.source === selectedGroup.value.source && g.type === selectedGroup.value.type
    );
    return group ? group.data : [];
  });

  // Загрузка данных с кэшированием
  const fetchTopPlayers = async () => {
    if (groups.value.length > 0) {
      return;
    }
    isLoading.value = true;
    try {
      const response = await getTopPlayers();
      groups.value = response.data; // API возвращает TopPlayerGroup[]

      // Автоматически выбираем первую группу, если selectedGroup не установлено
      if (groups.value.length > 0 && !selectedGroup.value) {
        const firstGroup = groups.value[0];
        selectedGroup.value = { source: firstGroup.source, type: firstGroup.type };
      }
    } catch (error) {
      console.error('Failed to fetch top players:', error);
      groups.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  // Выбор группы
  const selectGroup = (source: string, type: string) => {
    selectedGroup.value = { source, type };
  };

  return {
    groups,
    selectedGroup,
    selectedGroupData,
    isLoading,
    fetchTopPlayers,
    selectGroup,
  };
});