<template>
  <div v-if="isLoading" class="spinner-container">
    <div class="spinner"></div>
  </div>
  <div v-else-if="topPlayers.length" class="players-list">
      <div
        v-for="(item, index) in topPlayers"
        :key="item.player.id"
        class="player-row"
        :class="{
          'row-gold': !localPosition && item.ratingSnapshot?.position === 1,
          'row-silver': !localPosition && item.ratingSnapshot?.position === 2,
          'row-bronze': !localPosition && item.ratingSnapshot?.position === 3,
          'row-selected': selectedPlayer?.id === item.player.id
        }"
      >
        <div v-if="loadingByPlayer.get(item.player.id)" class="player-skeleton">
          <div class="skeleton-position"></div>
          <div class="skeleton-name"></div>
          <div class="skeleton-rating"></div>
        </div>
        <template v-else>
        <div class="player-info">
          <span
            class="position-badge"
            :class="{
              'position-gold': !localPosition && item.ratingSnapshot?.position === 1,
              'position-silver': !localPosition && item.ratingSnapshot?.position === 2,
              'position-bronze': !localPosition && item.ratingSnapshot?.position === 3,
              'position-local' : localPosition,
              'position-unknown': !item.ratingSnapshot
            }"
          >
            {{ localPosition ? index + 1 : item.ratingSnapshot?.position ?? '?' }}
          </span>
          <span class="player-name" @click="showPlayerPage(item.player)">{{ item.player.details!.name }}</span>
          <span 
            v-if="item.ratingSnapshot && item.ratingSnapshot.positionChange !== 0"
            class="change-badge"
            :class="{
              'change-positive': item.ratingSnapshot!.positionChange > 0,
              'change-negative': item.ratingSnapshot!.positionChange < 0
            }"
          >
            {{ changeValueFormatted(item.ratingSnapshot!.positionChange) }}
          </span>
          <div v-if="$slots.actions" class="rating-container">
            <slot name="actions" :player="item.player" />
          </div>
          <div v-else class="rating-container">
            <span
              v-if="item.ratingSnapshot && item.ratingSnapshot.ratingChange !== 0"
              class="change-badge"
              :class="{
                'change-positive': item.ratingSnapshot!.ratingChange > 0,
                'change-negative': item.ratingSnapshot!.ratingChange < 0
              }"
            >
              {{ changeValueFormatted(item.ratingSnapshot!.ratingChange) }}
            </span>
            <span
              v-if="item.ratingSnapshot"
              class="rating"
              :class="{
                'rating-gold': item.ratingSnapshot!.position === 1,
                'rating-silver': item.ratingSnapshot!.position === 2,
                'rating-bronze': item.ratingSnapshot!.position === 3
              }"
            >
              {{ item.ratingSnapshot!.rating }}
            </span>
          </div>
        </div>
        <div class="player-badges">
          <PlayerAttributes :player="item.player" :no-wrapper="true" />
          <span v-if="item.ratingSnapshot && topType === TopType.Global" class="badge badge-secondary badge-date">
            {{ formatDate(item.ratingSnapshot!.updatedAt) }}
          </span>
        </div>
        </template>
      </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { type Player, type TopPlayer, TopType } from '@/api';
import { formatDate } from '@/common';
import PlayerAttributes from './PlayerAttributes.vue';

const props = defineProps<{
  topPlayers: TopPlayer[];
  topType: TopType;
  selectedPlayer?: Player | null;
  isLoading: boolean;
  loadingByPlayer?: Map<string, boolean>;
  localPosition?: boolean;
}>();

const router = useRouter();
const loadingByPlayer = props.loadingByPlayer ?? new Map();

const changeValueFormatted = (change: number): string => {
  if (change > 0) return `↑ ${change}`;
  if (change < 0) return `↓ ${Math.abs(change)}`;
  return '';
};

function showPlayerPage(player: Player) {
  router.push(`/players/${player.id}`);
}

</script>

<style scoped>
.players-list {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  max-width: 800px;
  margin: 0 auto;
}

.player-row {
  display: flex;
  flex-direction: column;
  padding: 10px 3px;
  border-bottom: 1px solid #eee;
}

.player-row:last-child {
  border-bottom: 0;
}

.row-gold {
  background-color: #fffffb;
}

.row-silver {
  background-color: #fdfeff;
}

.row-bronze {
  background-color: #fffbf8;
}

.row-selected {
  background-color: #fffdf8;
  border-bottom: 2px solid #ccb68d;
  border-radius: 4px;
  background-color: #f7f4ed;
}

.player-info {
  display: flex;
  align-items: center;
  width: 100%;
  flex-wrap: nowrap;
  gap: 12px;
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
}

.position-gold {
  background-color: #FFECB3;
  color: #D4A017;
  border: none;
  font-weight: 700;
}

.position-silver {
  background-color: #E2E8F0;
  color: #64748B;
  border: none;
  font-weight: 700;
}

.position-bronze {
  background-color: #F4C7AB;
  color: #9C4B1F;
  border: none;
  font-weight: 700;
}

.position-local {
  background-color: #FFFFFF;
  border: 1px solid #b9bfc5;
  color: #b9bfc5;
  font-weight: normal;
}

.position-unknown {
  border: none;
  background-color: #F8FAFC;
  color: #CBD5E1;
}

.player-name {
  font-size: 1.2rem;
  font-weight: 500;
  color: #151e27;
  cursor: pointer;
}

.player-name:hover {
  text-decoration: underline;
}

.rating-container {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.rating {
  font-size: 1rem;
  font-weight: 500;
  color: #151e27;
}

.rating-gold {
  color: #D4A017;
  font-weight: 700;
}

.rating-silver {
  color: #64748B;
  font-weight: 700;
}

.rating-bronze {
  color: #9C4B1F;
  font-weight: 700;
}

.change-badge {
  padding: 6px;
  border-radius: 8px;
  font-size: 0.625rem;
  font-weight: 500;
}

.change-positive {
  background-color: #f6fff9;
  color: #7db9a1;
}

.change-negative {
  background-color: #fdf7f7;
  color: #b87878;
}

.player-badges {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
  margin-left: 40px;
}

.badge {
  background-color: #F0F4F8;
  color: #151e27;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-secondary {
  background-color: #F8FAFC;
  color: #CBD5E1;
}

.badge-date {
  margin-left: auto;
}

.player-skeleton {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 10px 0;
}

.skeleton-position {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-name {
  width: 120px;
  height: 20px;
  border-radius: 4px;
  background: #e2e8f0;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-rating {
  margin-left: auto;
  width: 60px;
  height: 20px;
  border-radius: 4px;
  background: #e2e8f0;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@media (max-width: 768px) {
  .players-list {
    gap: 5px;
  }

  .player-info {
    gap: 8px;
  }

  .player-row {
    padding: 0px 1px 5px 1px;
  }

  .position-badge {
    width: 20px;
    height: 20px;
    font-size: 0.6rem;
  }

  .player-name {
    font-size: 1.0rem;
  }

  .rating {
    font-size: 0.8rem;
  }

  .player-badges {
    margin-left: 32px;
  }

  .change-badge {
    padding: 3px;
    border-radius: 8px;
    font-size: 0.525rem;
  }
}
</style>