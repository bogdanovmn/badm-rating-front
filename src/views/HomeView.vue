<template>
  <div class="home">
    <PlayerSearch />
    <RatingChart />
  </div>
</template>

<script setup lang="ts">
import PlayerSearch from '@/components/PlayerSearch.vue';
import RatingChart from '@/components/RatingChart.vue';
</script>

<style scoped>
.home {
  width: 98%;
  padding: 20px;
}
</style>