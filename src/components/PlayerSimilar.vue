<template>
  <div v-if="similar.length" class="similar-players">
    <div class="warning-title">
      <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4A261" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/></svg>
      <b>Возможное</b> дублирование профиля
    </div>
    <div class="suggestions-list">
      <div
        v-for="sp in similar"
        :key="sp.id"
        class="player-row"
        @click="onSelect(sp)"
      >
        <span class="player-name">{{ sp.details.name }}</span>
        <PlayerAttributes :player="sp" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { playerStore } from '@/stores/player';
import type { Player } from '@/api';
import PlayerAttributes from './PlayerAttributes.vue';

const pStore = playerStore();

const similar = computed(() => pStore.similarPlayers());

async function onSelect(player: Player): Promise<void> {
  pStore.selectPlayer(player);
}
</script>

<style scoped>
.similar-players {
  margin-top: 40px;
}

.warning-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 400;
  color: #F4A261;
  background-color: #FFF4E6;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.warning-icon {
  flex-shrink: 0;
  stroke: #F4A261;
}

.suggestions-list {
  max-width: 800px;
  margin: 20px auto;
}

.player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.player-row:hover {
  background-color: #f9f9f9;
}

.player-name {
  font-size: 1.2rem;
  font-weight: 500;
  color: #151e27;
}

@media (max-width: 768px) {
  .suggestions-list {
    max-width: 100%;
  }

  .player-row {
    padding: 10px;
    margin-bottom: 6px;
  }

  .player-name {
    font-size: 1.1rem;
  }

  .warning-title {
    font-size: 1.0rem;
    padding: 10px;
  }
}
</style>