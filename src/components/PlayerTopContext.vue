<template>
  <span v-if="selectedTopContext.length">
    <h2 v-if="topType === TopType.Actual">
      Позиция в ТОП игроков на <span class='top-date'>{{formatDate(actualTopContextDate)}}</span>
    </h2>
    <h2 v-else>
      Позиция в ТОП игроков <span class="top-date">за все время</span>
    </h2>
    <div class="top-type-toggle">
      <button v-if="actualTopContextDate" class="toggle-button" @click="toggleTopType">
        {{ topType === TopType.Actual ? 'Показать за все время' : 'Показать актуальный' }}
      </button>
    </div>
    <TopPlayers 
      :top-players="selectedTopContext"
      :top-type="topType" 
      :selected-player="selectedPlayer"
      :is-loading="pStore.isTopContextLoading"
    />
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { playerStore } from '@/stores/player';
import { TopType, type Player, type TopPlayer } from '@/api';
import TopPlayers from './TopPlayers.vue';
import { formatDate } from '@/common';

const props = defineProps<{
  actualTopPlayers: TopPlayer[];
  globalTopPlayers: TopPlayer[];
  selectedPlayer: Player | null;
}>();

const pStore = playerStore();
const actualTopContextDate = computed(() => props.actualTopPlayers[0]?.updatedAt)

const topType = ref<TopType>(actualTopContextDate ? TopType.Actual : TopType.Global);
const selectedTopContext = computed(() =>
  topType.value === TopType.Actual && actualTopContextDate.value
    ? props.actualTopPlayers
    : props.globalTopPlayers
);

function toggleTopType(): void {
  topType.value = topType.value === TopType.Actual ? TopType.Global : TopType.Actual;
}

</script>

<style scoped>
h2 {
  text-align: center;
  margin-bottom: 12px;
  font-size: 1.8rem;
}

h2 span.top-date {
  color: #806e0a;
  font-weight: bolder;
}

.top-type-toggle {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.toggle-button {
  padding: 8px 16px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
  background-color: #FFE4B5;
}

.toggle-button:hover {
  background-color: #E5E7EB;
}

@media (max-width: 768px) {
  .top-type-toggle {
    flex-direction: column;
    gap: 8px;
  }

  .toggle-button {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}
</style>