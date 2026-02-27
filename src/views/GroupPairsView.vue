<template>
  <div v-if="group" class="group-pairs-view">
    <h1>
      <PairGroupIcon class="title-icon" />
      {{ group.name }}
    </h1>

    <div class="group-type-toggle">
        <button
          class="toggle-button"
          type="button"
          @click="showGroupPage(group)"
          title="Перейти в одиночный режим"
        >
          Перейти в одиночный режим
        </button>
        <button
          class="toggle-button toggle-button-edit-mode"
          type="button"
          @click="toggleEditMode()"
          :title="isEditMode ? 'Перейти в режим просмотра' : 'Перейти в режим редактирования'"
        >
          {{ isEditMode ? 'Просмотр' : 'Редактировать' }}
        </button>
    </div>

    <SourceTypeFilter v-if="!isEditMode"
      :selected-source="selectedSource"
      :selected-play-type="selectedPlayType"
      :available-sources="playFilterAvailableValues"
      :is-active="isEverythingLoaded"
      @update:filter="updateFilter"
    />

    <div v-if="isEverythingLoaded && filteredPairs.length" class="pairs-section">
      <h2>Сформированные пары</h2>
      <div class="pairs-list">
        <div
          v-for="(pair, index) in filteredPairs"
          :key="pair.join('-')"
          class="pair-card"
        >
          <div class="position-badge">
            {{ index + 1 }}
          </div>
          <div class="pair-players-details">
            <div class="pair-player" @click="goToPlayer(pair[0])">
              {{ allPlayers.get(pair[0])?.player.details?.name }}
              <PlayerAttributes :player="allPlayers.get(pair[0])!.player" :no-wrapper="false" />
            </div>
            <div class="pair-player" @click="goToPlayer(pair[1])">
              {{ allPlayers.get(pair[1])?.player.details?.name }}
              <PlayerAttributes :player="allPlayers.get(pair[1])!.player" :no-wrapper="false" />
            </div>
          </div>
          <div class="pair-summary">
            <template v-if="selectedSource && selectedPlayType">
              {{ allPlayers.get(pair[0])?.snapshot(selectedSource, selectedPlayType)?.rating!
                + allPlayers.get(pair[1])?.snapshot(selectedSource, selectedPlayType)?.rating! }}
            </template>
            <template v-else>
              <button class="disband-btn" @click.stop="disbandPair(pair)">
                <svg viewBox="0 0 24 24" class="close-icon">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="isEverythingLoaded && !isEditMode" class="hint">
      Нет пар удовлетворябщих выбранному фильтру
    </div>

    <div class="unpaired-section">
      <div v-if="filteredUnpairedPlayers.length" class="suggestions-list">
        <h2>Игроки без пары</h2>
        <div 
          v-for="playerId in filteredUnpairedPlayers" 
          class="player-content"
          :class="{ 'selected-player': selectedPlayerId === playerId || potentialPairPlayerId === playerId }"
          @click="handlePlayerClick(playerId)"
        >
          <div class="player-name">{{ allPlayers.get(playerId)!.player.details!.name }}</div>
          <PlayerAttributes :player="allPlayers.get(playerId)!.player" :no-wrapper="false" />
        </div>
      </div>
    </div>

    <div v-if="filteredUnpairedPlayers.length > 1" class="hint">
      💡 Кликните на игрока, чтобы выделить его, затем на другого игрока для создания пары
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Создать пару?</h3>
        <p class="modal-players">
          <div>{{ allPlayers.get(selectedPlayerId!)!.player.details!.name }}</div>
          <div class="plus">+</div>
          <div>{{ allPlayers.get(potentialPairPlayerId!)!.player.details!.name }}</div>
        </p>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="closeModal">Нет</button>
          <button class="modal-btn modal-btn-confirm" @click="confirmCreatePair">Да</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { playerStore } from '@/stores/player'
import { groupById, groupPlayers, groupPairs, addPairToGroup, removePairFromGroup } from '@/api'
import { PlayType, type Group, type Player, type RatingSnapshot, type RatingState, type Source, type TopPlayer } from '@/api'
import PairGroupIcon from '@/components/icons/PairGroupIcon.vue'
import SourceTypeFilter from '@/components/SourceTypeFilter.vue'
import PlayerAttributes from '@/components/PlayerAttributes.vue'

const route = useRoute()
const router = useRouter()
const groupId = route.params.groupId as string

const pStore = playerStore()
const group = ref<Group | null>(null)
const selectedSource = ref<Source | null>(null);
const selectedPlayType = ref<PlayType | null>(null);
const isPlayerLoading = ref<Set<string>>(new Set());
const isEverythingLoaded = ref<boolean>(false)
const playFilterAvailableValues = ref<Map<Source, Map<PlayType, boolean>>>(new Map())
const isEditMode = ref<boolean>(true)

const selectedPlayerId = ref<string | null>(null)
const potentialPairPlayerId = ref<string | null>(null)
const showModal = ref<boolean>(false)

const allPlayers = ref<(Map<string, PlayerRating>)>(new Map())
const pairs = ref<[string, string][]>([])
const filteredPairs = ref<[string, string][]>([])
const filteredUnpairedPlayers = ref<string[]>([])

class PlayerRating {
    player: Player
    rating: RatingState[]
    constructor(player: Player, rating: RatingState[]) {
        this.player = player
        this.rating = rating;
    }

    snapshot(source: Source | null, playType: PlayType | null): RatingSnapshot | undefined {
        return this.rating.find(r => r.source === source && r.playType === playType)?.ratingSnapshot;
    }

    withPlayType(playType: PlayType): boolean {
      return this.rating.find(r => r.playType === playType) != undefined
    }
}

// Вычисляемые имена для модального окна
const selectedPlayerName = computed(() => {
  if (!selectedPlayerId.value) return ''
  return allPlayers.value.get(selectedPlayerId.value)?.player.details?.name || ''
})

const potentialPairPlayerName = computed(() => {
  if (!potentialPairPlayerId.value) return ''
  return allPlayers.value.get(potentialPairPlayerId.value)?.player.details?.name || ''
})

const unpairedPlayers = computed(() => {
  const pairedIds = new Set(pairs.value.flat())
  return Array.from(allPlayers.value.entries())
    .filter(([id, data]) => !pairedIds.has(id) && data.player !== null)
    .map(([id, data]) => id)
})

onMounted(async () => {
  await loadEverything()
})

watch(pairs, () => {
  updateView()
})

function showGroupPage(group: Group) {
  router.push(`/groups/${group.id}`)
}

function goToPlayer(playerId: string) {
  pStore.selectPlayer(allPlayers.value.get(playerId)!.player)
  router.push(`/players/${playerId}`)
}

function toggleEditMode() {
  if (isEditMode.value) {
    isEditMode.value = false;
    selectedSource.value = playFilterAvailableValues.value.keys().next().value!
    selectedPlayType.value = playFilterAvailableValues.value.get(selectedSource.value)!.keys().next().value!
  } else {
    selectedSource.value = null
    selectedPlayType.value = null
    isEditMode.value = true
  }
  updateView()
}

watch([selectedSource, selectedPlayType], () => {
  if (!selectedPlayType.value) {
    isEditMode.value = true;
  } else {
    isEditMode.value = false;
  }
}, { immediate: true });

async function loadEverything() {
  try {
    const [g, playerIds, pairData] = await Promise.all([
      groupById(groupId),
      groupPlayers(groupId),
      groupPairs(groupId)
    ])

    group.value = g
    pairs.value = pairData || []

    const playerPromises = playerIds.map(async (id) => {
      isPlayerLoading.value.add(id)
      try {
        const [info, rating] = await Promise.all([
          pStore.loadInfo(id),
          pStore.loadRatingStat(id)
        ])
        return { id, info, rating }
      } catch (error) {
        console.error(`Ошибка загрузки данных игрока ${id}:`, error)
        return { id, info: null, rating: [] }
      } finally {
        isPlayerLoading.value.delete(id)
      }
    })
    const results = await Promise.all(playerPromises)
    const playersMap = new Map<string, PlayerRating>()
    results.forEach(result => {
      playersMap.set(result.id, new PlayerRating(result.info!, result.rating))
      applyAvailableFilterValues(result.rating)
    })    
    allPlayers.value = playersMap
  } catch (err) {
    console.error('Ошибка загрузки парного списка', err)
  } finally {
    updateView()
    isEverythingLoaded.value = true
  }
}

function applyAvailableFilterValues(states: RatingState[]) {
    for (const s of states) {
        if (s.playType == PlayType.MS || s.playType == PlayType.WS) {
          continue
        }
        if (!playFilterAvailableValues.value.has(s.source)) {
            playFilterAvailableValues.value.set(s.source, new Map());
        }
        playFilterAvailableValues.value.get(s.source)!.set(s.playType, true);
    }
}

function updateFilter({ source, playType }: { source: Source | null; playType: PlayType | null }): void {
    const disableFilter = selectedSource.value === source && selectedPlayType.value == playType;
    selectedSource.value = disableFilter ? null : source
    selectedPlayType.value = disableFilter ? null : playType
    updateView()
}

function updateView(): void {
    const filteredPlayers: Set<string> = new Set()
    const disableFilter = selectedSource.value === null || selectedPlayType.value == null;
    allPlayers.value.forEach((data, playerId) => {
      const st = data.snapshot(selectedSource.value, selectedPlayType.value)
      if (disableFilter || st) {
        filteredPlayers.add(playerId)
      }
    })
    const filtredPairsUpdate = pairs.value.filter(p => {
      if (disableFilter) {
        return true;
      } 
      if (selectedPlayType.value === PlayType.XD) {
        const p1 = allPlayers.value.get(p[0])!
        const p2 = allPlayers.value.get(p[1])!
        return p1.withPlayType(PlayType.MD) && p2.withPlayType(PlayType.WD)
          || p1.withPlayType(PlayType.WD) && p2.withPlayType(PlayType.MD)
      } else {
        return filteredPlayers.has(p[0]) && filteredPlayers.has(p[1])
      }
    })
    filtredPairsUpdate.sort((pairA, pairB) => {
      const getPairRatingSum = (pair: [string, string]): number => {
        return allPlayers.value.get(pair[0]) && allPlayers.value.get(pair[1])
          ? allPlayers.value.get(pair[0])!.snapshot(selectedSource.value, selectedPlayType.value)?.rating!
            + allPlayers.value.get(pair[1])!.snapshot(selectedSource.value, selectedPlayType.value)?.rating!
          : 0
      }
      return getPairRatingSum(pairB) - getPairRatingSum(pairA)
    })
    
    filteredPairs.value = filtredPairsUpdate
    filteredUnpairedPlayers.value = unpairedPlayers.value.filter(p => filteredPlayers.has(p))
}

function handlePlayerClick(playerId: string) {
  if (selectedPlayerId.value === playerId) {
    selectedPlayerId.value = null
    return
  }
  
  if (!selectedPlayerId.value) {
    selectedPlayerId.value = playerId
    return
  }
  
  if (selectedPlayerId.value !== playerId) {
    potentialPairPlayerId.value = playerId
    showModal.value = true
  }
}

function closeModal() {
  showModal.value = false
  selectedPlayerId.value = null
  potentialPairPlayerId.value = null
}

async function confirmCreatePair() {
  if (selectedPlayerId.value && potentialPairPlayerId.value) {
    await createPair(selectedPlayerId.value, potentialPairPlayerId.value)
  }
  closeModal()
}

async function createPair(id1: string, id2: string) {
  const pair: [string, string] = [id1, id2]
  await addPairToGroup(groupId, pair)
  pairs.value = [...pairs.value, pair]
}

async function disbandPair(pair: [string, string]) {
  if (!confirm('Расформировать эту пару?')) return
  await removePairFromGroup(groupId, pair[0])
  pairs.value = pairs.value.filter(p => p.join('-') !== pair.join('-'))
}
</script>

<style scoped>

.title-icon {
  width: 32px;
  height: 18px;
}

.pairs-section, .unpaired-section {
  margin-bottom: 40px;
}

.pairs-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pair-card {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 5px;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  align-content: space-between;
  justify-content: flex-start;
  gap: 20px;
}

.pair-card:hover {
  background-color: #fffbf4cc;;
}

.pair-players-details {
  display: flex;
  flex-direction: column;
  gap: 7px;
  cursor: pointer;
}

.pair-player {
  display: flex;
  flex-direction: row;
  align-content: space-between;
  gap: 15px;
  flex-wrap: nowrap;
}

.pair-summary {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-content: center;
  margin-left: auto;
  margin-right: 15px;
}

.disband-btn {
  width: 32px;
  height: 32px;
  background: white;
  border: 2px solid #ff6b6b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-icon {
  width: 16px;
  height: 16px;
  fill: #ff6b6b;
}

.player-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 3px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.player-content:hover {
  background-color: #f0f0f0;
}

.player-content:last-child {
  border: 0;
}

.selected-player {
  background-color: #ffeedb;
  border-left: 4px solid #f39f21;
  padding-left: 8px;
}

.hint {
  text-align: center;
  padding: 16px;
  background: #fff8e1;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #d68900;
  margin: 20px auto;
  max-width: 70%;
}

.suggestions-list {
  max-width: 800px;
  margin: 20px auto;
}

.player-row {
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

.group-type-toggle {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
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

.toggle-button-edit-mode {
  min-width: 18ch;
}

.position-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #FFFFFF;
  border: 1px solid #b9bfc5;
  color: #b9bfc5;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 500;
  margin-left: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.5rem;
}

.modal-players {
  font-size: 1.2rem;
  font-weight: 500;
  color: #201605;
  margin: 16px 0;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.modal-players .plus {
  font-weight: 900;
  font-size: x-large;
  color: #684932
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.modal-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.modal-btn-cancel {
  background-color: #e0e0e0;
  color: #333;
}

.modal-btn-cancel:hover {
  background-color: #d0d0d0;
}

.modal-btn-confirm {
  background-color: #4caf50;
  color: white;
}

.modal-btn-confirm:hover {
  background-color: #45a049;
}

@media (max-width: 768px) {
  .pair-card {
    gap: 12px;
  }
  .pair-players-details {
    gap: 1px;
  }
  .position-badge {
    margin-left: 5px;
  }
  .pair-player {
    flex-direction: column;
    gap: 2px;
  }

  .player-draggable {
    max-width: 100%;
    padding: 8px 3px;
  }

  .player-row {
    padding: 10px;
    margin-bottom: 6px;
  }

  .player-name {
    font-size: 0.95rem;
  }
 
  .top-type-toggle {
    flex-direction: column;
    gap: 8px;
  }

  .toggle-button {
    padding: 6px 12px;
    font-size: 0.9rem;
  }

  .title-icon {
    width: 22px;
    height: 14px;
  }

  .hint {
    padding: 16px;
    font-size: 0.7rem;
    margin-top: 0px;
    max-width: 95%;
  }

  .modal-content {
    padding: 16px;
  }
  
  .modal-content h3 {
    font-size: 1.2rem;
  }
  
  .modal-players {
    font-size: 1rem;
    padding: 8px;
  }
  
  .modal-btn {
    padding: 8px 16px;
  }
}
</style>