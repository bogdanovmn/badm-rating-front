<template>
  <h1 v-if="player">
    {{ player.details.name }}
    <PlayerAttributes :player="player" />
  </h1>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { playerStore } from '@/stores/player';
import PlayerAttributes from './PlayerAttributes.vue';

const pStore = playerStore();
const player = computed(() => pStore.selectedPlayer);
</script>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  h1 {
    flex-direction: column;
    gap: 5px;
  }
}
</style>