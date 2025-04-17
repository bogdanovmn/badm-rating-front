import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getTopPlayers } from '@/api';
import type { TopPlayerGroup, TopPlayerData } from '@/api';

export const useTopPlayersStore = defineStore('topPlayers', () => {
  const groups = ref<TopPlayerGroup[]>([]);
  const selectedGroup = ref<{ key: string; source: string; type: string } | null>(null);
  const isLoading = ref(false);

  async function fetchTopPlayers() {
    try {
      isLoading.value = true;
      const response = await getTopPlayers();
      if (!Array.isArray(response.data)) {
        console.warn('Response.data is not an array:', response.data);
        groups.value = [];
      } else {
        groups.value = response.data;
        // Выбираем первую группу по умолчанию
        if (groups.value.length > 0) {
          selectedGroup.value = {
            key: `${groups.value[0].source}-${groups.value[0].type}`,
            source: groups.value[0].source,
            type: groups.value[0].type,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching top players:', error);
      groups.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function selectGroup(source: string, type: string) {
    selectedGroup.value = { key: `${source}-${type}`, source, type };
  }

  function clearGroups() {
    groups.value = [];
    selectedGroup.value = null;
  }

  // Вычисляем данные для выбранной группы
  const selectedGroupData = computed(() => {
    if (!selectedGroup.value) return [];
    const group = groups.value.find(
      (g) => g.source === selectedGroup.value!.source && g.type === selectedGroup.value!.type
    );
    return group ? group.data : [];
  });

  return {
    groups,
    selectedGroup,
    selectedGroupData,
    isLoading,
    fetchTopPlayers,
    selectGroup,
    clearGroups,
  };
});