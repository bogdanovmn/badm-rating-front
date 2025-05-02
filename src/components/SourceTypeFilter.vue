<template>
  <div class="source-groups">
    <fieldset
      v-for="source in SOURCE_ORDER"
      :key="source"
      class="source-group"
      :disabled="!isSourceAvailable(source)"
      :data-source="source"
    >
      <legend>
        {{ sourceAttributes[source].name }}
      </legend>
      <div class="playtype-tabs">
        <button
          v-for="type in PLAY_TYPE_ORDER"
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
import { SOURCE_ORDER, PLAY_TYPE_ORDER } from '@/common';

const props = defineProps<{
  selectedSource: Source | null;
  selectedPlayType: PlayType | null;
  availableSources?: Map<Source, Map<PlayType, any>>;
}>();

const emit = defineEmits<{
  (e: 'update:filter', value: { source: Source; playType: PlayType }): void;
}>();

interface SourceAttributes {
  name: string;
}

const sourceAttributes: Record<Source, SourceAttributes> = {
  RNBF: {
    name: 'НФБР'
  },
  RNBFJunior: {
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
  border-radius: 18px;
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

.source-group[data-source="RNBFJunior"] legend {
  background-color: #fff5f0;
  border: 1px solid #ebc69e;
  color: #b4834f;
  border-radius: 10px;
}

fieldset.source-group[data-source="RNBFJunior"] {
  background-color: #fffbf8;
  border: 1px solid #ebc69e;
  color: #b4834f;
  border-radius: 10px;
}

.source-group[data-source="RNBFJunior"] .tab-button {
  background-color: #fff5f0;
  border-color: #ebc69e;
  color: #b4834f;
}

.source-group[data-source="RNBFJunior"] .tab-button.active {
  background-color: #FDBA74;
  color: #805324;
}

.source-group[data-source="RNBF"] legend {
  background-color: #f0f6ff;
  border: 1px solid #afd4ec;
  border-radius: 10px;
  color: #4f77b4;
}

fieldset.source-group[data-source="RNBF"] {
  background-color: #f6f9ff;
  border: 1px solid #afd4ec;
  border-radius: 10px;
  color: #4f83b4;
}

.source-group[data-source="RNBF"] .tab-button {
  background-color: #f0f6ff;
  border-color: #afd4ec;
  color: #4f83b4;
}

.source-group[data-source="RNBF"] .tab-button.active {
  background-color: #94cbff;
  color: #245780;
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