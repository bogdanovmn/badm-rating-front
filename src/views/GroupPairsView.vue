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
    </div>

    <SourceTypeFilter
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

    <div class="unpaired-section">
      <div v-if="filteredUnpairedPlayers.length" 
        class="suggestions-list"
        @dragover.prevent
        @dragenter.prevent
        @drop.prevent="onDrop"
      >
        <h2>Игроки без пары</h2>
        <p v-if="filteredUnpairedPlayers.length > 1">
          Перетащите одного игрока на другого, чтобы создать пару
        </p>
        <div
          v-for="playerId in filteredUnpairedPlayers"
          :key="playerId"
          class="player-draggable"
          :class="{ 'dragging': draggingId === playerId }"
          draggable="true"
          :data-player-id="playerId"
          @dragstart="dragStart(playerId)"
          @dragend="draggingId = null"
          @touchstart.prevent="touchStart(playerId, $event)"
          @touchmove.prevent="touchMove($event)"
          @touchend.prevent="touchEnd"
          @click="goToPlayer(playerId)"
        >
          <div class="player-name">{{ allPlayers.get(playerId)!.player.details!.name }}</div>
          <PlayerAttributes :player="allPlayers.get(playerId)!.player" :no-wrapper="false" />
        </div>
      </div>
    </div>

    <div v-if="isTouchDevice" class="mobile-hint">
      💡 Долгое нажатие на игрока → перетащите на другого
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue'
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

const allPlayers = ref<(Map<string, PlayerRating>)>(new Map())
const pairs = ref<[string, string][]>([])
const filteredPairs = ref<[string, string][]>([])
const filteredUnpairedPlayers = ref<string[]>([])
const draggingId = ref<string | null>(null)
const touchTargetId = ref<string | null>(null)

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

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

function dragStart(id: string) {
  draggingId.value = id
}

function onDrop(e: DragEvent) {
  if (!draggingId.value) return

  const targetElement = e.target as HTMLElement
  const targetCard = targetElement.closest('.player-draggable')
  if (!targetCard) return

  const targetId = targetCard.getAttribute('data-player-id')
    || Array.from(targetCard.querySelectorAll('[data-player-id]'))
        .find(el => el.getAttribute('data-player-id'))?.getAttribute('data-player-id')

  if (targetId && targetId !== draggingId.value) {
    createPair(draggingId.value, targetId)
  }
}

function touchStart(id: string, e: TouchEvent) {
  touchTargetId.value = id
  draggingId.value = id
}

function touchMove(e: TouchEvent) {
  if (!touchTargetId.value) return

  const touch = e.touches[0]
  const element = document.elementFromPoint(touch.clientX, touch.clientY)
  const targetCard = element?.closest('.player-draggable')

  document.querySelectorAll('.player-draggable').forEach(el => {
    el.classList.remove('drag-over')
  })
  if (targetCard) {
    targetCard.classList.add('drag-over')
  }
}

function touchEnd() {
  if (!touchTargetId.value) return

  const overElement = document.querySelector('.player-draggable.drag-over')
  if (overElement) {
    const targetId = overElement.getAttribute('data-player-id')
      || overElement.querySelector('[data-player-id]')?.getAttribute('data-player-id')
    if (targetId && targetId !== touchTargetId.value) {
      createPair(touchTargetId.value, targetId)
    }
  }

  draggingId.value = null
  touchTargetId.value = null
  document.querySelectorAll('.player-draggable').forEach(el => {
    el.classList.remove('drag-over')
  })
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

.player-draggable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
  transition: all 0.2s;
  overflow: hidden;
  max-width: 800px;
  padding: 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.player-draggable:last-child {
  border: 0;
}

.player-draggable:active {
  cursor: grabbing;
}

.player-draggable.dragging {
  opacity: 0.6;
  transform: scale(0.95);
  z-index: 10;
}

.player-draggable.drag-over {
  outline: 4px dashed #d68900;
  outline-offset: 4px;
}

.mobile-hint {
  text-align: center;
  padding: 16px;
  background: #fff8e1;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #d68900;
  margin-top: 20px;
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

.position-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #FFFFFF;
  border: 1px solid #69747e;
  color: #151e27;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 500;
  margin-left: 20px;
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
}
</style>