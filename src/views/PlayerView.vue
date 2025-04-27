<template>
  <div class="home">
    <PlayerSearch />
    <PlayerDetails v-if="pStore.selectedPlayer"/>
    <RatingChart v-if="pStore.selectedPlayer"/>
    <PlayerSimilar v-if="pStore.selectedPlayer"/>
    <PlayerTopContext v-if="pStore.selectedPlayer"/>
  </div>
</template>

<script setup lang="ts">
import PlayerDetails from '@/components/PlayerDetails.vue';
import PlayerSearch from '@/components/PlayerSearch.vue';
import PlayerSimilar from '@/components/PlayerSimilar.vue';
import RatingChart from '@/components/RatingChart.vue';
import PlayerTopContext from '@/components/PlayerTopContext.vue';

import { playerStore } from '@/stores/player';

const pStore = playerStore();
</script>

<style scoped>
.home {
  width: 100%;
  padding: 0;
}
</style>