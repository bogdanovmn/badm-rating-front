<template>
  <h1 v-if="player">
    {{ player.details.name }}
    <span class="player-badges">
      <span class="badge">{{ player.details.year }}</span>
      <span class="badge">{{ player.details.region }}</span>
      <span v-if="player.details.rank !== 'NO_RANK'" class="badge">{{ player.details.rank }}</span>
    </span>
  </h1>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { playerStore } from '@/stores/player';

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

.player-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  background-color: #F0F4F8;
  color: #151e27;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  h1 {
    flex-direction: column;
    gap: 5px;
  }

  .badge {
    font-size: 0.7rem;
    padding: 2px 6px;
  }
}
</style>