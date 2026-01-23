<template>
    <PlayerSearch />
    <div v-if="player" class="player-header">
      <PlayerDetails :player="player"/>
      <SourceTypeFilter
        :selected-source="selectedSource"
        :selected-play-type="selectedPlayType"
        :available-sources="ratingData"
        :is-active="true"
        @update:filter="setRatingFilter"
      />
      <div v-if="!pStore.isLoading" class="rating-resume">
        <div>Рейтинг: <span class="value">{{ lastRating }}</span></div>
        <div v-if="actualTopContext.length">
          <span class="value">{{ actualTopPosition?.value }}</span><span class="value-suffix">-е</span> место!
        </div>
        <div v-else>
          <span class="value">{{ actualTopPosition?.value }}</span><span class="value-suffix">-е</span> место (исторически на {{ formatDate(actualTopPosition?.date) }})
        </div>
        <div><span class="value">{{ globalTopPosition?.value }}</span><span class="value-suffix">-е</span> место за все время</div>
      </div>
      <RatingChart
        :rating-data="ratingHistory"
        :actual-top-position-data="actualTopPositionHistory"
        :global-top-position-data="globalTopPositionHistory"
        :is-loading="pStore.isLoading"
      />
      <PlayerSimilar :players="similarPlayers"/>
      <PlayerTopContext
        :actual-top-players="actualTopContext" 
        :global-top-players="globalTopContext" 
        :selected-player="player"
      />
      <div class="actions">
        <button v-if="aStore.isAuthenticated && allGroups.length > 0" @click="openGroupsOverlay" class="add-to-group-btn">
          Добавить в список
        </button>
      </div>
    </div>
    <div v-else-if="playerId" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <teleport to="body">
      <div v-if="showGroupsOverlay" class="overlay" @click.self="showGroupsOverlay = false">
        <div class="groups-modal" @click.stop>
          <div class="modal-header">
            <h3>Добавить в список</h3>
            <button @click="showGroupsOverlay = false" class="close-btn">×</button>
          </div>

          <div v-if="isLoadingGroups" class="modal-loading">
            <div class="spinner"></div>
          </div>

          <div v-else-if="allGroups.length === 0" class="modal-empty">
            <p v-if="allGroups.length === 0">
              У вас нет списков.<br>
              <strong>Создайте первый</strong> на странице Мои списки
            </p>
            <p v-else>
              Игрок уже добавлен во все ваши списки
            </p>
          </div>

          <div v-else class="groups-list-simple">
            <button
              v-for="group in allGroups"
              :key="group.id"
              @click="addToGroupAndClose(group.id)"
              :disabled="addingToGroup.has(group.id)"
              class="group-item-simple"
            >
              {{ group.name }}
              <span v-if="addingToGroup.has(group.id)" class="spinner-small"></span>
            </button>
          </div>
        </div>
      </div>
    </teleport>
</template>

<script setup lang="ts">
import PlayerDetails from '@/components/PlayerDetails.vue';
import PlayerSearch from '@/components/PlayerSearch.vue';
import PlayerSimilar from '@/components/PlayerSimilar.vue';
import RatingChart from '@/components/RatingChart.vue';
import PlayerTopContext from '@/components/PlayerTopContext.vue';

import { playerStore } from '@/stores/player';
import { groupsStore } from '@/stores/groups'
import { authStore } from '@/stores/auth'
import { computed, watch, ref, onMounted } from 'vue';
import { addPlayerToGroup, PlayType, Source, TopType, type Group } from '@/api';
import { formatDate, PLAY_TYPE_ORDER, SOURCE_ORDER } from '@/common';
import SourceTypeFilter from '@/components/SourceTypeFilter.vue';

const { playerId } = defineProps<{ playerId?: string }>()

const pStore = playerStore();
const gStore = groupsStore();
const aStore = authStore();

const player = computed(() => pStore.selectedPlayer);

const showGroupsOverlay = ref<boolean>(false)
const isLoadingGroups = ref<boolean>(false)
const allGroups = ref<Group[]>([])
const addingToGroup = ref<Set<string>>(new Set())

const loadGroupsForCurrentPlayer = async () => {
  if (!player.value) return
  isLoadingGroups.value = true
  allGroups.value = await gStore.loadGroupsForPlayer(player.value.id)
  isLoadingGroups.value = false
}

const openGroupsOverlay = async () => {
  showGroupsOverlay.value = true
  await loadGroupsForCurrentPlayer()
}

const addToGroupAndClose = (groupId: string) => {
  if (!player.value || addingToGroup.value.has(groupId)) return

  addingToGroup.value.add(groupId)

  addPlayerToGroup(groupId, player.value.id)
    .then(() => {
      // Успешно — закрываем оверлей
      showGroupsOverlay.value = false
    })
    .catch(() => {
      alert('Не удалось добавить в список')
    })
    .finally(() => {
      addingToGroup.value.delete(groupId)
    })
}

const similarPlayers = computed(() => pStore.similarPlayers());

const globalTopContext = computed(() => pStore.topContext(TopType.Global));
const actualTopContext = computed(() => pStore.topContext(TopType.Actual));

const selectedSource = computed(() => pStore.selectedSource);
const selectedPlayType = computed(() => pStore.selectedPlayType);

const ratingData = computed(() => pStore.ratingHistory());
const ratingHistory = computed(() => 
  selectedSource.value && selectedPlayType.value
    ? ratingData.value.get(selectedSource.value)!.get(selectedPlayType.value) || []
    : []
);

const lastRating = computed(() => !pStore.isLoading && ratingHistory.value.length ? ratingHistory.value[ratingHistory.value.length - 1].value : 0);

const actualTopPositionHistory = computed(() => pStore.topPositionHistory(TopType.Actual));
const globalTopPositionHistory = computed(() => pStore.topPositionHistory(TopType.Global));

const actualTopPosition = computed(() => {
  return actualTopPositionHistory.value.length
    ? actualTopPositionHistory.value[actualTopPositionHistory.value.length - 1]
    : null
});
const globalTopPosition = computed(() => {
  return globalTopPositionHistory.value.length
    ? globalTopPositionHistory.value[globalTopPositionHistory.value.length - 1]
    : null
});


function initializeSelection(): void {
  if (ratingData.value.size === 0) {
    pStore.clearSourceFilter();
    return;
  }

  const availableSource = SOURCE_ORDER.find((source) => ratingData.value.has(source));
  if (!availableSource) {
    pStore.clearSourceFilter()
    return;
  }

  const availablePlayType = PLAY_TYPE_ORDER.find((playType) =>
    ratingData.value.get(availableSource)!.has(playType)
  );

  pStore.setSourceFilter(availableSource, availablePlayType!);
}

function setRatingFilter({ source, playType }: { source: Source; playType: PlayType }) {
  pStore.setSourceFilter(source, playType);
}

watch(ratingData, () => {
  initializeSelection();
}, { immediate: true });

watch([selectedSource, selectedPlayType], () => {
  pStore.loadTopPositionHistory();
  pStore.loadPlayerTopContext();
}, { immediate: true });

onMounted(loadPlayerData)

watch(() => playerId, (newId) => {
  if (newId) {
    loadPlayerData()
  }
})

watch(() => player.value, (newPlayer) => {
  if (newPlayer) {
    loadPlayerData()
  }
})

async function loadPlayerData() {
  if (playerId) {
    try {
      const player = await pStore.loadInfo(playerId)
      if (player) {
        pStore.selectPlayer(player)
        await loadGroupsForCurrentPlayer()
      }
    } finally {
    }
  } else if (player.value) {
    await loadGroupsForCurrentPlayer()
  }
}

</script>

<style scoped>
.rating-resume {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-bottom: 0px;
  padding: 12px;
  background-color: #f8fdff;
  border-radius: 8px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.rating-resume > div {
  font-size: 1.2rem;
  font-weight: 100;
  color: #969590;
  text-align: center;
}

.rating-resume > div > span.value {
  font-weight: bold;
  color: #806e0a;
  margin: 0 4px;
}

span.value-suffix {
  font-weight: 100;
  font-size: small;
  color: #b3b3b3;
  margin: 0;
}

.add-to-group-btn {
  margin-top: 12px;
  padding: 10px 18px;
  background: #FFE4B5;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.add-to-group-btn:hover {
  background: #ffcc80;
  transform: translateY(-1px);
}

.add-to-group-btn .icon {
  width: 20px;
  height: 20px;
  fill: #806e0a;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.groups-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  font-family: inherit;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9f9f9;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  font-size: 1.8rem;
  cursor: pointer;
  color: #999;
}

.close-btn:hover { color: #333; }

.modal-loading {
  padding: 40px;
  text-align: center;
}

.modal-empty {
  padding: 40px 20px;
  text-align: center;
  color: #666;
  line-height: 1.5;
}

.modal-empty strong {
  color: #806e0a;
}

.groups-list-simple {
  max-height: 60vh;
  overflow-y: auto;
}

.group-item-simple {
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-bottom: 1px solid #eee;
  background: white;
  text-align: left;
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-item-simple:hover {
  background: #fff8e1;
}

.group-item-simple:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #806e0a;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

div.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .rating-resume {
    padding: 10px;
  }

  .rating-resume > div {
    font-size: 1rem;
  }
}
</style>