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
      <div v-if="pStore.isTopContextLoading" class="rating-resume loading">
        <div class="skeleton-loader">
          <div class="skeleton-item"></div>
          <div class="skeleton-item"></div>
          <div class="skeleton-item"></div>
        </div>
        <div class="loading-text">Загрузка данных...</div>
      </div>
      
      <div v-else class="rating-resume">
        <div class="rating-main">
          <span class="rating-label">Текущий рейтинг</span>
          <div class="rating-value-wrapper">
            <span class="rating-value">{{ lastRating }}</span>
            <span v-if="ratingHistory.length >= 2 && getTrendValue() !== '0'" class="rating-trend" :class="getTrendClass()">
              {{ getTrendIcon() }} {{ getTrendValue() }}
            </span>
          </div>
        </div>
        
        <div class="rating-stats">
          <div v-if="juniorTopContext.length" class="stat-item highlight">
            <span class="stat-icon">🏆</span>
            <span class="stat-text">
              <b>{{ juniorTopPosition }}</b> место в возрастной группе
            </span>
          </div>
          
          <div class="stat-item">
            <span class="stat-icon">📊</span>
            <span class="stat-text">
              <template v-if="actualTopContext.length">
                <b>{{ actualTopPosition?.value }}</b> место среди всех
              </template>
              <template v-else>
                <b>{{ actualTopPosition?.value }}</b> место среди всех (на <b>{{ formatDate(actualTopPosition?.date) }}</b>)
              </template>
            </span>
          </div>
          
          <div class="stat-item">
            <span class="stat-icon">⭐</span>
            <span class="stat-text">
              <b>{{ globalTopPosition?.value }}</b> место за всё время
            </span>
          </div>
        </div>
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
        :junior-top-players="juniorTopContext"
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
import { addPlayerToGroup, PlayType, Source, TopType, YearGroup, type Group } from '@/api';
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

const getTrendValue = () => {
  if (ratingHistory.value.length < 2) return '';
  const last = ratingHistory.value[ratingHistory.value.length - 1].value;
  const prev = ratingHistory.value[ratingHistory.value.length - 2].value;
  const diff = last - prev;
  return `${diff > 0 ? '+' : ''}${diff}`;
};

const getTrendIcon = () => {
  if (ratingHistory.value.length < 2) return '';
  const last = ratingHistory.value[ratingHistory.value.length - 1].value;
  const prev = ratingHistory.value[ratingHistory.value.length - 2].value;
  const diff = last - prev;
  if (diff > 0) return '▲';
  if (diff < 0) return '▼';
  return '•';
};

const getTrendClass = () => {
  if (ratingHistory.value.length < 2) return '';
  const last = ratingHistory.value[ratingHistory.value.length - 1].value;
  const prev = ratingHistory.value[ratingHistory.value.length - 2].value;
  const diff = last - prev;
  if (diff > 0) return 'trend-up';
  if (diff < 0) return 'trend-down';
  return 'trend-neutral';
};

const loadGroupsForCurrentPlayer = async () => {
  if (!aStore.isAuthenticated) return
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
const juniorTopContext = computed(() => pStore.topJuniorContext());

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
const juniorTopPosition = computed(() => {
  return juniorTopContext.value.length
    ? juniorTopContext.value.filter(p => p.player.id == player.value?.id)[0].ratingSnapshot?.position
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

function setRatingFilter({ source, playType }: { source: Source; playType: PlayType | null, yearGroup: YearGroup | null }) {
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
  background-color: #f8fdff;
  border-radius: 8px;
  padding: 16px;
  margin: 16px auto;
  max-width: 600px;
  border: 1px solid #e6f0f5;
}

/* Состояние загрузки */
.rating-resume.loading {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.skeleton-loader {
  width: 100%;
  max-width: 300px;
}

.skeleton-item {
  height: 20px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin: 8px 0;
  border-radius: 4px;
}

.skeleton-item:nth-child(1) { width: 60%; }
.skeleton-item:nth-child(2) { width: 80%; }
.skeleton-item:nth-child(3) { width: 70%; }

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.loading-text {
  color: #969590;
  font-size: 0.9rem;
}

/* Основной рейтинг */
.rating-main {
  text-align: center;
  margin-bottom: 16px;
}

.rating-label {
  display: block;
  font-size: 0.9rem;
  color: #969590;
  margin-bottom: 4px;
}

.rating-value-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.rating-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #806e0a;
  line-height: 1;
}

.rating-trend {
  font-size: 1rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  background-color: white;
}

.trend-up {
  color: #7db9a1;
  background-color: #e8f5e9;
}

.trend-down {
  color: #b87878;
  background-color: #ffebee;
}

.trend-neutral {
  color: #806e0a;
  background-color: #fff3e0;
}

/* Статистика */
.rating-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e6f0f5;
  font-size: 0.95rem;
}

.stat-item.highlight {
  background-color: #fff8e1;
  border-color: #ffe082;
}

.stat-icon {
  font-size: 1.1rem;
  min-width: 24px;
  color: #806e0a;
}

.stat-text {
  color: #333;
  line-height: 1.4;
}

/* Адаптивность */
@media (max-width: 768px) {
  .rating-resume {
    padding: 12px;
    margin: 12px auto;
  }
  
  .rating-value {
    font-size: 2rem;
  }
  
  .stat-item {
    padding: 6px 10px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .rating-value {
    font-size: 1.8rem;
  }
  
  .rating-trend {
    font-size: 0.9rem;
    padding: 2px 6px;
  }
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

</style>