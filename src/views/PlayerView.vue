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
    <div v-if="!pStore.isLoading && player" class="rating-resume">
      <div>Рейтинг: <span class="value">{{ lastRating }}</span></div>
      <div v-if="actualTopContext.length">
        <span class="value">{{ actualTopPosition?.value }}</span><span class="value-suffix">-е</span> место!
      </div>
      <div v-else>
        <span class="value">{{ actualTopPosition?.value }}</span><span class="value-suffix">-е</span> место (исторически на {{ formatDate(actualTopPosition?.date) }})
      </div>
      <div><span class="value">{{ globalTopPosition?.value }}</span><span class="value-suffix">-е</span> место за все время</div>
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
import { formatDate, PLAY_TYPE_ORDER, SOURCE_ORDER } from '@/common';
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

const lastRating = computed(() => !pStore.isLoading && ratingHistory.value.length ? ratingHistory.value[ratingHistory.value.length - 1].value : 0);

const actualTopPositionHistory = computed(() => pStore.topPositionHistory(TopType.Actual));
const globalTopPositionHistory = computed(() => pStore.topPositionHistory(TopType.Global));

const actualTopPosition = computed(() => {
  return actualTopPositionHistory.value.length
    ? actualTopPositionHistory.value[actualTopPositionHistory.value.length - 1]
    : null
});
const globalTopPosition = computed(() => {
  return globalTopPositionHistory.value.length
    ? globalTopPositionHistory.value[globalTopPositionHistory.value.length - 1]
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
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-bottom: 0px;
  padding: 12px;
  background-color: #f8fdff;
  border-radius: 8px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.rating-resume > div {
  font-size: 1.2rem;
  font-weight: 100;
  color: #969590;
  text-align: center;
}

.rating-resume > div > span.value {
  font-weight: bold;
  color: #806e0a;
  margin: 0 4px;
}

span.value-suffix {
  font-weight: 100;
  font-size: small;
  color: #b3b3b3;
  margin: 0;
}

@media (max-width: 768px) {
  .rating-resume {
    padding: 10px;
  }

  .rating-resume > div {
    font-size: 1rem;
  }
}
</style>