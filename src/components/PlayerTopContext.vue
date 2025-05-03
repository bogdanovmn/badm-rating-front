<template>
  <template v-if="props.actualTopPlayers.length">
    <h1>
      Позиция в ТОП игроков на <span class='top-date'>{{formatDate(actualTopContextDate)}}</span>
    </h1>
    <TopPlayers 
      :top-players="props.actualTopPlayers"
      :top-type="TopType.Actual" 
      :selected-player="selectedPlayer"
      :is-loading="pStore.isTopContextLoading"
    />
  </template>
  <template v-if="props.globalTopPlayers.length">
    <h1>
      Позиция в ТОП игроков <span class="top-date">за все время</span>
    </h1>
    <TopPlayers
      :top-players="props.globalTopPlayers"
      :top-type="TopType.Global" 
      :selected-player="selectedPlayer"
      :is-loading="pStore.isTopContextLoading"
    />
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { playerStore } from '@/stores/player';
import { TopType, type Player, type TopPlayer } from '@/api';
import TopPlayers from './TopPlayers.vue';
import { formatDate } from '@/common';

const props = defineProps<{
  actualTopPlayers: TopPlayer[];
  globalTopPlayers: TopPlayer[];
  selectedPlayer: Player;
}>();

const pStore = playerStore();
const actualTopContextDate = computed(() => props.actualTopPlayers[0]?.updatedAt)

</script>

<style scoped>
h1 {
  text-align: center;
  margin: 20px 0;
  font-size: 1.5rem;
}

h1 span.top-date {
  color: #806e0a;
  font-weight: bolder;
}

@media (max-width: 768px) {
  h1 {
    font-size: 1.3rem;
  }
}
</style>