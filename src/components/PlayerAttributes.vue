<template>
    <template v-if="noWrapper">
      <span v-if="player.details.year" class="badge">{{ player.details.year }}</span>
      <span v-if="player.details.region" class="badge badge-secondary">{{ player.details.region }}</span>
      <span v-if="player.details.rank !== 'NO_RANK'" class="badge badge-secondary">{{ player.details.rank }}</span>
    </template>
    <span v-else class="player-badges">
      <span v-if="player.details.year" class="badge">{{ player.details.year }}</span>
      <span v-if="player.details.region" class="badge badge-secondary">{{ player.details.region }}</span>
      <span v-if="player.details.rank !== 'NO_RANK'" class="badge badge-secondary">{{ player.details.rank }}</span>
    </span>
  </template>

<script setup lang="ts">
import type { Player } from '@/api';


const props = defineProps<{
    player: Player;
    noWrapper?: boolean;
}>();

</script>

<style scoped>

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

.badge-secondary {
  background-color: #F8FAFC;
  color: #CBD5E1;
}

@media (max-width: 768px) {
    .badge {
        font-size: 0.7rem;
        padding: 2px 6px;
    }
}
</style>