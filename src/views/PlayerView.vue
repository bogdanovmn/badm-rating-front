<template>
  <div class="home">
    <PlayerSearch />
    <PlayerDetails />
    <RatingChart />
    <PlayerSimilar />
  </div>
</template>

<script setup lang="ts">
import PlayerDetails from '@/components/PlayerDetails.vue';
import PlayerSearch from '@/components/PlayerSearch.vue';
import PlayerSimilar from '@/components/PlayerSimilar.vue';
import RatingChart from '@/components/RatingChart.vue';
</script>

<style scoped>
.home {
  width: 100%;
  padding: 0;
}
</style>