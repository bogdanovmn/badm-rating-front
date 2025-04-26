import { defineStore } from 'pinia';
import { ref } from 'vue';
import { playersTop } from '@/api';
import type { TopPlayers, TopType, Source, PlayType } from '@/api';

interface TopKey {
  topType: TopType;
  source: Source;
  playType: PlayType;
}

export const topPlayersStore = defineStore('topPlayers', () => {
  const topData = ref<Map<string, TopPlayers[]>>(new Map());
  const isLoading = ref<boolean>(false);

  function getTopKey({ topType, source, playType }: TopKey): string {
    return `${topType}_${source}_${playType}`;
  }

  async function loadTopPlayers(topType: TopType, source: Source, playType: PlayType): Promise<void> {
    const key = getTopKey({ topType, source, playType });
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

  function getTopPlayers(topType: TopType, source: Source, playType: PlayType): TopPlayers[] {
    const key = getTopKey({ topType, source, playType });
    return topData.value.get(key) || [];
  }

  return {
    isLoading,
    loadTopPlayers,
    getTopPlayers,
  };
});