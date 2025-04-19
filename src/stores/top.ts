import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getTopPlayers, getTopActualPlayers, type TopPlayerGroup } from '@/api';

export const useTopPlayersStore = defineStore('topPlayers', () => {
  // Состояние для типа топа
  const topType = ref<'actual' | 'all-time'>('actual');

  // Кэшированные данные для каждого типа топа
  const actualTopGroups = ref<TopPlayerGroup[]>([]);
  const topGroups = ref<TopPlayerGroup[]>([]);

  // Выбранная группа (source и type)
  const selectedGroup = ref<{ source: string; type: string } | null>(null);

  // Флаг загрузки
  const isLoading = ref(false);

  // Текущие группы в зависимости от типа топа
  const groups = computed(() => {
    return topType.value === 'actual' ? actualTopGroups.value : topGroups.value;
  });

  // Данные выбранной группы
  const selectedGroupData = computed(() => {
    if (!selectedGroup.value) return [];
    const currentGroups = groups.value;
    const group = currentGroups.find(
      (g) => g.source === selectedGroup.value!.source && g.type === selectedGroup.value!.type
    );
    return group ? group.data : [];
  });

  // Загрузка данных топа
  const fetchTopPlayers = async () => {
    // Если данные уже загружены, не загружаем повторно
    if (
      (topType.value === 'actual' && actualTopGroups.value.length > 0) ||
      (topType.value === 'all-time' && topGroups.value.length > 0)
    ) {
      return;
    }

    isLoading.value = true;
    try {
      const apiCall = topType.value === 'actual' ? getTopActualPlayers : getTopPlayers;
      const response = await apiCall();
      const data = response.data as TopPlayerGroup[];
      if (topType.value === 'actual') {
        actualTopGroups.value = data;
      } else {
        topGroups.value = data;
      }
    } catch (error) {
      console.error(`Failed to fetch ${topType.value} top players:`, error);
      if (topType.value === 'actual') {
        actualTopGroups.value = [];
      } else {
        topGroups.value = [];
      }
    } finally {
      isLoading.value = false;
    }
  };

  // Выбор группы
  const selectGroup = (source: string, type: string) => {
    selectedGroup.value = { source, type };
    fetchTopPlayers();
  };

  // Переключение типа топа
  const selectTopType = (type: 'actual' | 'all-time') => {
    topType.value = type;
    // Если группа не выбрана, устанавливаем по умолчанию
    if (!selectedGroup.value) {
      selectedGroup.value = { source: 'RNBF', type: 'MS' };
    }
    fetchTopPlayers();
  };

  return {
    topType,
    groups,
    selectedGroup,
    selectedGroupData,
    isLoading,
    fetchTopPlayers,
    selectGroup,
    selectTopType,
  };
});