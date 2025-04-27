import { defineStore } from 'pinia';
import { ref } from 'vue';
import { playersTop } from '@/api';
import type { TopPlayer, TopType, Source, PlayType } from '@/api';
import { TopKey } from '@/common';


export const topPlayersStore = defineStore('topPlayers', () => {
  const topData = ref<Map<string, TopPlayer[]>>(new Map());
  const isLoading = ref<boolean>(false);

  async function loadTopPlayers(topType: TopType, source: Source, playType: PlayType): Promise<void> {
    const key = new TopKey(topType, source, playType).value();
    if (topData.value.has(key)) {
      return;
    }
    isLoading.value = true;
    try {
      const data = await playersTop(topType, source, playType);
      topData.value.set(key, data);
    } catch (error: any) {    
      topData.value.set(key, []);
    } finally {
      isLoading.value = false;
    }
  }

  function getTopPlayers(topType: TopType, source: Source, playType: PlayType): TopPlayer[] {
    const key = new TopKey(topType, source, playType).value();
    return topData.value.get(key) || [];
  }

  return {
    isLoading,
    loadTopPlayers,
    getTopPlayers,
  };
});