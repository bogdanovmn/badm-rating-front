<template>
  <h1 v-if="topType === TopType.Actual">
    ТОП игроков на <span class='top-date'>{{formatDate(selectedGroupData[0]?.ratingSnapshot?.updatedAt)}}</span>
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
    :selected-year-group="selectedYearGroup"
    :show-year-groups="topType == TopType.Actual"
    :is-active="true"
    @update:filter="updateFilter"
  />

  <TopPlayers 
    :top-players="selectedGroupData"
    :top-type="topType" 
    :selected-player="storePlayer.selectedPlayer"
    :is-loading="topStore.isLoading"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { topPlayersStore } from '@/stores/top';
import { playerStore } from '@/stores/player';
import SourceTypeFilter from '@/components/SourceTypeFilter.vue';
import TopPlayers from '@/components/TopPlayers.vue';
import { TopType, Source, PlayType, YearGroup } from '@/api';
import { formatDate } from '@/common';

const topStore = topPlayersStore();
const storePlayer = playerStore();

const topType = ref<TopType>(TopType.Actual);
const selectedSource = ref<Source>(Source.RNBFJunior);
const selectedPlayType = ref<PlayType>(PlayType.MS);
const selectedYearGroup = ref<YearGroup>(YearGroup.All);

const selectedGroupData = computed(() => {
  return topStore.getTopPlayers(topType.value, selectedSource.value, selectedPlayType.value, selectedYearGroup.value);
});

function toggleTopType(): void {
  topType.value = topType.value === TopType.Actual ? TopType.Global : TopType.Actual;
}

function updateFilter({ source, playType, yearGroup }: { source: Source; playType: PlayType | null, yearGroup: YearGroup | null }): void {
  selectedSource.value = source;
  if (topType.value == TopType.Global) {
    yearGroup = YearGroup.All
  }
  if (playType) {
    selectedPlayType.value = playType;
  }
  if (yearGroup && topType.value == TopType.Actual) {
    if (selectedSource.value == Source.RNBF) {
      selectedSource.value = Source.RNBFJunior;
    }
    selectedYearGroup.value = yearGroup;
  }
  if (selectedSource.value == Source.RNBF) {
    selectedYearGroup.value = YearGroup.All;
  }
}

watch([topType, selectedSource, selectedPlayType, selectedYearGroup], async () => {
  await topStore.loadTopPlayers(topType.value, selectedSource.value, selectedPlayType.value, selectedYearGroup.value);
}, { immediate: true });
</script>

<style scoped>
.top-players-container {
  width: 100%;
  margin: 0;
  padding: 20px 0;
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