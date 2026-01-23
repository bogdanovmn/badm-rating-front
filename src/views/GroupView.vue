<template>
  <div v-if="isPreLoading" class="spinner-container">
    <div class="spinner"></div>
  </div>
  <span v-else>
    <h1>{{ group!.name }}</h1>

    <div class="group-type-toggle">
        <button
          class="toggle-button"
          type="button"
          @click="showGroupPairsPage()"
          title="Перейти в парный режим"
        >
          Перейти в парный режим
        </button>
    </div>
    <SourceTypeFilter
      :selected-source="selectedSource"
      :selected-play-type="selectedPlayType"
      :available-sources="playFilterAvailableValues"
      :is-active="isEverythingLoaded"
      @update:filter="updateFilter"
    />

    <TopPlayers :top-players="playersViewData"
                :top-type="topType" 
                :is-loading="isPreLoading"
                :loading-by-player="isPlayerLoading">
      <template v-if="!selectedSource && !selectedPlayType" #actions="{ player }">
        <div class="delete-wrapper">
          <button
            @click="removePlayer(player.id)"
            class="delete-button"
            :disabled="isDeleting.has(player.id)"
            :title="isDeleting.has(player.id) ? 'Удаляется...' : 'Удалить игрока из списка'"
          >
            <svg v-if="!isDeleting.has(player.id)" viewBox="0 0 24 24" class="close-icon">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <div v-else class="spinner-small"></div>
          </button>
        </div>
      </template>
    </TopPlayers>

    <div v-if="!isPreLoading && isPlayerLoading.size == 0" class="empty">
        В списке пока нет игроков
    </div>
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { playerStore } from '@/stores/player';
import { groupPlayers, TopType, PlayType, Source, removePlayerFromGroup, groupById } from '@/api';
import type { Player, RatingSnapshot, RatingState, TopPlayer, Group } from '@/api';
import SourceTypeFilter from '@/components/SourceTypeFilter.vue';
import TopPlayers from '@/components/TopPlayers.vue';

const { groupId } = defineProps<{ groupId: string }>()

const router = useRouter()

const pStore = playerStore()
const group = ref<Group | null>(null)

const selectedSource = ref<Source | null>(null);
const selectedPlayType = ref<PlayType | null>(null);
const isPreLoading = ref<boolean>(true);
const isPlayerLoading = ref<Map<string, boolean>>(new Map());
const isEverythingLoaded = ref<boolean>(false)
const topType = ref<TopType>(TopType.Actual);
const playersData = ref<Map<string, PlayerRating>>(new Map());
const playersViewData = ref<TopPlayer[]>([]);
const playFilterAvailableValues = ref<Map<Source, Map<PlayType, boolean>>>(new Map())

const isDeleting: Set<String> = new Set()

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

function showGroupPairsPage() {
  router.push(`/groups/${group.value!.id}/pairs`)
}

onMounted(async () => {
  try {
    const [playerIds, groupBrief] = await Promise.all([
      groupPlayers(groupId),
      groupById(groupId)
    ])
    isPreLoading.value = false

    group.value = groupBrief
    if (!playerIds || playerIds.length === 0) {
      return
    }

    playerIds.reduce((acc, curr) => {
        acc.set(curr, true);
        return acc;
    }, isPlayerLoading.value)

    const loadPromises = playerIds.map(async (id) => {
      try {
        const emptyPlayer: TopPlayer = { player : { id } }
        playersViewData.value.push(emptyPlayer)
        
        const [player, rating] = await Promise.all([
          pStore.loadInfo(id),
          pStore.loadRatingStat(id)
        ])
        const index = playersViewData.value.findIndex(p => p.player.id === id)
        if (player != null && index !== -1) {
          playersData.value.set(id, new PlayerRating(player, rating))
          applyAvailableFilterValues(rating)
          playersViewData.value[index] = { player }
          isPlayerLoading.value.set(id, false)
          if (!isLoadingDetails()) {
            playersViewData.value.sort((a, b) => a.player.details!.name > b.player.details!.name ? 1 : -1)
            isEverythingLoaded.value = true;
          }
        }
      } catch (err) {
        console.error(`Ошибка загрузки игрока ${id}`, err)
      }
    })
  } catch (err) {
    console.error('Не удалось загрузить список игроков группы', err)
  }
})

function applyAvailableFilterValues(states: RatingState[]) {
    for (const s of states) {
        if (!playFilterAvailableValues.value.has(s.source)) {
            playFilterAvailableValues.value.set(s.source, new Map());
        }
        playFilterAvailableValues.value.get(s.source)!.set(s.playType, true);
    }
}

function isLoadingDetails(): boolean {
    return Array.from(isPlayerLoading.value.values()).some(v => v === true)
}

function updateFilter({ source, playType }: { source: Source | null; playType: PlayType | null }): void {
    const disableFilter = selectedSource.value === source && selectedPlayType.value == playType;
    selectedSource.value = disableFilter ? null : source
    selectedPlayType.value = disableFilter ? null : playType
    const viewData: TopPlayer[] = []
    playersData.value.forEach(
        pd => {
            const st = pd.snapshot(selectedSource.value, selectedPlayType.value)
            if (disableFilter || st) {
                viewData.push({ player: pd.player, ratingSnapshot: st })
            }
        }
    )
    viewData.sort((a, b) => 
        disableFilter
            ? a.player.details!.name > b.player.details!.name ? 1 : -1
            : a.ratingSnapshot!.position > b.ratingSnapshot!.position ? 1 : -1
    )
    playersViewData.value = viewData
}

function removePlayer(playerId: string) {
  isDeleting.add(playerId)
  removePlayerFromGroup(group.value!.id, playerId)
    .then(() => {
      playersData.value.delete(playerId)
      updateFilter({ source: selectedSource.value, playType: selectedPlayType.value })
    })
    .finally(() => {
      isDeleting.delete(playerId)
    })
}
</script>

<style scoped>
.player-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.player-card.loading {
  opacity: 0.7;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
}

.delete-wrapper {
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.delete-button {
  width: 28px;
  height: 28px;
  background: white;
  border: 2px solid #ff6b6b;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.delete-button:hover:not(:disabled) {
  background: #fff5f5;
  border-color: #ff5252;
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}

.delete-button:active:not(:disabled) {
  transform: scale(0.98);
}

.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #ddd;
}

.close-icon {
  width: 18px;
  height: 18px;
  fill: #ff6b6b;
  transition: fill 0.2s;
}

.delete-button:hover:not(:disabled) .close-icon {
  fill: #ff5252;
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

@media (max-width: 768px) {
  .top-type-toggle {
    flex-direction: column;
    gap: 8px;
  }

  .toggle-button {
    padding: 6px 12px;
    font-size: 0.9rem;
  }

  .delete-button {
    width: 20px;
    height: 20px;
    border: 1px solid #ff6b6b;
  }
}
</style>