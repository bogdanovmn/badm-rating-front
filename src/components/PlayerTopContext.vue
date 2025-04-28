<template>
  <span v-if="selectedTopContext.length">
    <h1 v-if="topType === TopType.Actual">
      Позиция в ТОП игроков на <span class='top-date'>{{formatDate(actualTopContext[0]?.updatedAt)}}</span>
    </h1>
    <h1 v-else>
      Позиция в ТОП игроков <span class="top-date">за все время</span>
    </h1>
    <div class="top-type-toggle">
      <button v-if="actualTopContext.length" class="toggle-button" @click="toggleTopType">
        {{ topType === TopType.Actual ? 'Показать за все время' : 'Показать актуальный' }}
      </button>
    </div>
    <TopPlayers 
      :top-players="selectedTopContext"
      :top-type="topType" 
      :selected-player="pStore.selectedPlayer"
      :is-loading="pStore.isTopContextLoading"
    />
  </span>
</template>

<script setup lang="ts">
import { watch, ref, computed } from 'vue';
import { playerStore } from '@/stores/player';
import { TopType } from '@/api';
import TopPlayers from './TopPlayers.vue';
import { formatDate } from '@/common';

const pStore = playerStore();
const globalTopContext = computed(() => pStore.topContext(TopType.Global));
const actualTopContext = computed(() => pStore.topContext(TopType.Actual));
const topType = ref<TopType>(TopType.Global);
const selectedTopContext = computed(() => topType.value === TopType.Actual && actualTopContext.value.length > 0 ? actualTopContext.value : globalTopContext.value);
const selectedSource = computed(() => pStore.selectedSource)
const selectedPlayType = computed(() => pStore.selectedPlayType)

function toggleTopType(): void {
  topType.value = topType.value === TopType.Actual ? TopType.Global : TopType.Actual;
}

watch([selectedSource, selectedPlayType], 
  () => pStore.loadPlayerTopContext()
    .then(() => {
      topType.value = actualTopContext.value.length > 0 ? TopType.Actual : TopType.Global;
      return undefined;
    })
);
</script>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 12px;
  font-size: 1.8rem;
}

h1 span.top-date {
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