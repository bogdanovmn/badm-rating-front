import { defineStore } from 'pinia';
import { ref } from 'vue';
import { playersTop } from '@/api';
import type { TopPlayer, TopType, Source, PlayType, YearGroup } from '@/api';
import { TopKey } from '@/common';


export const topPlayersStore = defineStore('topPlayers', () => {
  const topData = ref<Map<string, TopPlayer[]>>(new Map());
  const isLoading = ref<boolean>(false);

  async function loadTopPlayers(topType: TopType, source: Source, playType: PlayType, yearGroup: YearGroup): Promise<void> {
    const key = new TopKey(topType, source, playType, yearGroup).value();
    if (topData.value.has(key)) {
      return;
    }
    isLoading.value = true;
    try {
      const data = await playersTop(topType, source, playType, yearGroup);
      topData.value.set(key, data);
    } catch (error: any) {    
      topData.value.set(key, []);
    } finally {
      isLoading.value = false;
    }
  }

  function getTopPlayers(topType: TopType, source: Source, playType: PlayType, yearGroup: YearGroup): TopPlayer[] {
    const key = new TopKey(topType, source, playType, yearGroup).value();
    return topData.value.get(key) || [];
  }

  return {
    isLoading,
    loadTopPlayers,
    getTopPlayers,
  };
});