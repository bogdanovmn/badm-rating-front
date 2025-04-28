<template>
  <div class="top-players-container">
    <h1 v-if="topType === TopType.Actual">
      ТОП игроков на <span class='top-date'>{{formatDate(selectedGroupData[0]?.updatedAt)}}</span>
    </h1>
    <h1 v-else>
      ТОП игроков <span class="top-date">за все время</span>
    </h1>

    <div class="top-type-toggle">
      <button
        class="toggle-button"
        @click="toggleTopType"
      >
        {{ topType === TopType.Actual ? 'Показать за все время' : 'Показать актуальный' }}
      </button>
    </div>

    <SourceTypeFilter
      :selected-source="selectedSource"
      :selected-play-type="selectedPlayType"
      @update:filter="updateFilter"
    />

    <TopPlayers 
      :top-players="selectedGroupData"
      :top-type="topType" 
      :selected-player="storePlayer.selectedPlayer"
      :is-loading="topStore.isLoading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { topPlayersStore } from '@/stores/top';
import { playerStore } from '@/stores/player';
import SourceTypeFilter from '@/components/SourceTypeFilter.vue';
import TopPlayers from '@/components/TopPlayers.vue';
import { TopType, Source, PlayType } from '@/api';
import { formatDate } from '@/common';

const topStore = topPlayersStore();
const storePlayer = playerStore();

const topType = ref<TopType>(TopType.Actual);
const selectedSource = ref<Source>(Source.RNBFJunior);
const selectedPlayType = ref<PlayType>(PlayType.MS);

const selectedGroupData = computed(() => {
  return topStore.getTopPlayers(topType.value, selectedSource.value, selectedPlayType.value);
});

function toggleTopType(): void {
  topType.value = topType.value === TopType.Actual ? TopType.Global : TopType.Actual;
}

function updateFilter({ source, playType }: { source: Source; playType: PlayType }): void {
  selectedSource.value = source;
  selectedPlayType.value = playType;
}

watch([topType, selectedSource, selectedPlayType], async () => {
  await topStore.loadTopPlayers(topType.value, selectedSource.value, selectedPlayType.value);
}, { immediate: true });
</script>

<style scoped>
.top-players-container {
  width: 100%;
  margin: 0;
  padding: 20px 0;
}

h1 {
  text-align: center;
  margin-bottom: 12px;
  font-size: 1.8rem;
}

h1 span.top-date {
  color: #806e0a;
  font-weight: bolder;
}

.top-type-toggle {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.toggle-button {
  padding: 8px 16px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
  background-color: #FFE4B5;
}

.toggle-button:hover {
  background-color: #E5E7EB;
}

@media (max-width: 768px) {
  .top-type-toggle {
    flex-direction: column;
    gap: 8px;
  }

  .toggle-button {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}
</style>