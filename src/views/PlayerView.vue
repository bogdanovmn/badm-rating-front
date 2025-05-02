<template>
  <div class="home">
    <PlayerSearch />
    <PlayerDetails v-if="player" :player="player"/>
    <SourceTypeFilter
      :selected-source="selectedSource"
      :selected-play-type="selectedPlayType"
      :available-sources="ratingData"
      @update:filter="setRatingFilter"
    />
    <div class="rating-resume">
      <h2>Рейтинг: {{ lastRating }}</h2>
      <template v-if="actualTopPosition">
        <h3>{{ actualTopPosition }}-е место!</h3>
      </template>
      <h3>{{ globalTopPosition }}-е место за всю историю НФБР</h3>
    </div>
    <RatingChart v-if="player"
      :rating-data="ratingHistory"
      :actual-top-position-data="actualTopPositionHistory"
      :global-top-position-data="globalTopPositionHistory"
      :is-loading="pStore.isLoading"
    />
    <PlayerSimilar v-if="player" :players="similarPlayers"/>
    <PlayerTopContext v-if="player" 
      :actual-top-players="actualTopContext" 
      :global-top-players="globalTopContext" 
      :selected-player="player"
    />
  </div>
</template>

<script setup lang="ts">
import PlayerDetails from '@/components/PlayerDetails.vue';
import PlayerSearch from '@/components/PlayerSearch.vue';
import PlayerSimilar from '@/components/PlayerSimilar.vue';
import RatingChart from '@/components/RatingChart.vue';
import PlayerTopContext from '@/components/PlayerTopContext.vue';

import { playerStore } from '@/stores/player';
import { computed, watch } from 'vue';
import { PlayType, Source, TopType } from '@/api';
import { PLAY_TYPE_ORDER, SOURCE_ORDER } from '@/common';
import SourceTypeFilter from '@/components/SourceTypeFilter.vue';

const pStore = playerStore();

const player = computed(() => pStore.selectedPlayer);

const similarPlayers = computed(() => pStore.similarPlayers());

const globalTopContext = computed(() => pStore.topContext(TopType.Global));
const actualTopContext = computed(() => pStore.topContext(TopType.Actual));

const selectedSource = computed(() => pStore.selectedSource);
const selectedPlayType = computed(() => pStore.selectedPlayType);

const ratingData = computed(() => pStore.ratingHistory());
const ratingHistory = computed(() => 
  selectedSource.value && selectedPlayType.value
    ? ratingData.value.get(selectedSource.value)!.get(selectedPlayType.value) || []
    : []
);

const lastRating = computed(() => !pStore.isLoading && ratingHistory.value ? ratingHistory.value[ratingHistory.value.length - 1].value : 0);

const actualTopPositionHistory = computed(() => pStore.topPositionHistory(TopType.Actual));
const globalTopPositionHistory = computed(() => pStore.topPositionHistory(TopType.Global));

const actualTopPosition = computed(() => {
  return actualTopPositionHistory.value.length
    ? actualTopPositionHistory.value[actualTopPositionHistory.value.length - 1].value
    : null
});
const globalTopPosition = computed(() => {
  return globalTopPositionHistory.value.length
    ? globalTopPositionHistory.value[globalTopPositionHistory.value.length - 1].value
    : null
});

// Инициализация выбора source и playType
function initializeSelection(): void {
  if (ratingData.value.size === 0) {
    pStore.clearSourceFilter();
    return;
  }
  // Находим первый доступный source в заданном порядке
  const availableSource = SOURCE_ORDER.find((source) => ratingData.value.has(source));
  if (!availableSource) {
    pStore.clearSourceFilter()
    return;
  }
  // Находим первый доступный playType в заданном порядке
  const availablePlayType = PLAY_TYPE_ORDER.find((playType) =>
    ratingData.value.get(availableSource)!.has(playType)
  );

  pStore.setSourceFilter(availableSource, availablePlayType!);
}

// Установка активного source и playType
function setRatingFilter({ source, playType }: { source: Source; playType: PlayType }) {
  pStore.setSourceFilter(source, playType);
}

// Следим за изменением ratingData и инициализируем выбор
watch(ratingData, () => {
  initializeSelection();
}, { immediate: true });

watch([selectedSource, selectedPlayType], () => {
  pStore.loadTopPositionHistory();
  pStore.loadPlayerTopContext();
}, { immediate: true });


</script>

<style scoped>
.home {
  width: 100%;
  padding: 0;
}
.rating-resume {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
</style>