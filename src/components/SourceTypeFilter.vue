<template>
  <div class="source-groups">
    <fieldset
      v-for="source in sourceOrder"
      :key="source"
      class="source-group"
      :disabled="!isSourceAvailable(source)"
      :data-source="source"
      :style="{
        backgroundColor: sourceAttributes[source].color.background,
        borderColor: sourceAttributes[source].color.border
      }"
    >
      <legend :style="{ color: sourceAttributes[source].color.text }">
        {{ sourceAttributes[source].name }}
      </legend>
      <div class="playtype-tabs">
        <button
          v-for="type in playTypeOrder"
          :key="type"
          :class="{ 'tab-button': true, active: selectedSource === source && selectedPlayType === type }"
          @click="emit('update:filter', { source, playType: type })"
          :disabled="!isPlayTypeAvailable(source, type)"
          :style="{ display: isPlayTypeAvailable(source, type) ? 'block' : 'none' }"
        >
          {{ type }}
        </button>
      </div>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { Source, PlayType } from '@/api';
import { sourceOrder, playTypeOrder } from '@/common';

const props = defineProps<{
  selectedSource: Source | null;
  selectedPlayType: PlayType | null;
  availableSources?: Map<Source, Map<PlayType, any>>; // Для проверки доступности
}>();

const emit = defineEmits<{
  (e: 'update:filter', value: { source: Source; playType: PlayType }): void;
}>();

interface SourceAttributes {
  color: {
    background: string;
    border: string;
    text: string;
  };
  name: string;
}

const sourceAttributes: Record<Source, SourceAttributes> = {
  RNBF: {
    color: {
      background: '#F0F6FF',
      border: '#D0E0FF',
      text: '#6B7280'
    },
    name: 'НФБР'
  },
  RNBFJunior: {
    color: {
      background: '#FFF7ED',
      border: '#FFE4CC',
      text: '#6B7280'
    },
    name: 'НФБР Юниорский'
  }
};

function isSourceAvailable(source: Source): boolean {
  return !props.availableSources || props.availableSources.has(source);
}

function isPlayTypeAvailable(source: Source, playType: PlayType): boolean {
  return !props.availableSources || (
    isSourceAvailable(source) && props.availableSources.get(source)!.has(playType)
);
}

</script>

<style scoped>
.source-groups {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.source-group {
  border-radius: 8px;
  padding: 10px;
  min-width: 160px;
  box-sizing: border-box;
  border-width: 0.5px;
}

.source-group:disabled {
  display: none;
}

.source-group legend {
  font-size: 0.9rem;
  font-weight: 400;
  padding: 0 8px;
  margin: 0;
}

.playtype-tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
}

.tab-button {
  flex: 1;
  padding: 6px 12px;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
  text-align: center;
  background-color: #F5FAFF;
}

.tab-button:hover {
  border-color: #999;
}

.tab-button.active {
  color: #333;
  font-weight: 700;
  border-color: transparent;
  background-color: #BFDBFE;
}

.tab-button:disabled {
  display: none;
}

.source-group[data-source="RNBFJunior"] .tab-button {
  background-color: #FFF5F0;
}

.source-group[data-source="RNBFJunior"] .tab-button.active {
  background-color: #FDBA74;
}

@media (max-width: 768px) {
  .source-groups {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .source-group {
    width: 100%;
    padding: 8px;
  }

  .source-group legend {
    font-size: 0.85rem;
  }

  .tab-button {
    padding: 5px 10px;
    font-size: 0.85rem;
  }
}
</style>