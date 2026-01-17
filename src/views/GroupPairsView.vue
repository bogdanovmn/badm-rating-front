<template>
  <div v-if="group" class="group-pairs-view">
    <h1>
      <PairGroupIcon class="title-icon" />
      {{ group.name }}
    </h1>

    <!-- Блок с существующими парами -->
    <div v-if="pairs.length" class="pairs-section">
      <h2>Сформированные пары</h2>
      <div class="pairs-grid">
        <div
          v-for="(pair, index) in pairs"
          :key="pair.join('-')"
          class="pair-card"
          @click="disbandPair(pair)"
          title="Нажмите, чтобы расформировать пару"
        >
          {{ allPlayers.get(pair[0])?.player.details?.name }}
          <br/> 
          {{ allPlayers.get(pair[1])?.player.details?.name }}
          <button class="disband-btn" @click.stop="disbandPair(pair)">
            <svg viewBox="0 0 24 24" class="close-icon">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="unpaired-section">
      <h2>
        {{ pairs.length ? 'Оставшиеся игроки' : 'Перетащите одного игрока на другого, чтобы создать пару' }}
      </h2>

      <div v-if="unpairedPlayers.length" 
        class="suggestions-list"
        @dragover.prevent
        @dragenter.prevent
        @drop.prevent="onDrop"
      >
        <div
          v-for="player in unpairedPlayers"
          :key="player!.id"
          class="player-draggable"
          :class="{ 'dragging': draggingId === player!.id }"
          draggable="true"
          :data-player-id="player!.id"
          @dragstart="dragStart(player!.id)"
          @dragend="draggingId = null"
          @touchstart.prevent="touchStart(player!.id, $event)"
          @touchmove.prevent="touchMove($event)"
          @touchend.prevent="touchEnd"
        >
          <span class="player-name">{{ player!.details!.name }}</span>
          <PlayerAttributes :player="player!" :no-wrapper="false" />
        </div>
      </div>
    </div>

    <!-- Подсказка для мобильных -->
    <div v-if="isTouchDevice" class="mobile-hint">
      💡 Долгое нажатие на игрока → перетащите на другого
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { playerStore } from '@/stores/player';
import PairGroupIcon from '@/components/icons/PairGroupIcon.vue'
import { groupById, groupPlayers, groupPairs, addPairToGroup, removePairFromGroup } from '@/api'
import type { Group, Player, PlayType, RatingSnapshot, RatingState, Source } from '@/api'
import PlayerAttributes from '@/components/PlayerAttributes.vue';

const route = useRoute()
const groupId = route.params.groupId as string

const pStore = playerStore()
const group = ref<Group | null>(null)
const allPlayers = ref<(Map<string, PlayerRating>)>(new Map())
const pairs = ref<[string, string][]>([])
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
}

const unpairedPlayers = computed(() => {
  const pairedIds = new Set(pairs.value.flat())
  return Array.from(allPlayers.value.entries())
    .filter(([id, data]) => !pairedIds.has(id) && data.player !== null)
    .map(([id, data]) => data.player)
})

onMounted(async () => {
  await loadEverything()
})

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
      try {
        const [info, rating] = await Promise.all([
          pStore.loadInfo(id),
          pStore.loadRatingStat(id)
        ])
        return { id, info, rating }
      } catch (error) {
        console.error(`Ошибка загрузки данных игрока ${id}:`, error)
        return { id, info: null, rating: [] }
      }
    })
    const results = await Promise.all(playerPromises)
    const playersMap = new Map<string, PlayerRating>()
    results.forEach(result => {
      playersMap.set(result.id, new PlayerRating(result.info!, result.rating))
    })    
    allPlayers.value = playersMap
  } catch (err) {
    console.error('Ошибка загрузки парного списка', err)
  }
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
  pairs.value.push(pair)
}

async function disbandPair(pair: [string, string]) {
  if (!confirm('Расформировать эту пару?')) return
  await removePairFromGroup(groupId, pair[0])
  pairs.value = pairs.value.filter(p => p.join('-') !== pair.join('-'))
}
</script>

<style scoped>
.group-pairs-view {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.8rem;
}

.title-icon {
  width: 32px;
  height: 32px;
}

h2 {
  margin: 32px 0 16px;
  color: #444;
  font-size: 1.4rem;
}

.pairs-section, .unpaired-section {
  margin-bottom: 40px;
}

.pairs-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.pair-card {
  position: relative;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.pair-card:hover {
  border-color: #ff6b6b;
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(255,107,107,0.15);
}

.pair-connector {
  font-size: 28px;
  font-weight: bold;
  color: #d68900;
}

.disband-btn {
  position: absolute;
  top: 8px;
  right: 8px;
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

.unpaired-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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

.empty-pairs {
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 1.2rem;
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

@media (max-width: 768px) {
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
}
</style>